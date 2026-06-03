
-- ============ HEALTH FACILITIES ============
CREATE TYPE public.facility_type AS ENUM ('hospital','health_center','health_post','pharmacy');

CREATE TABLE public.health_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.facility_type NOT NULL,
  address text,
  city text,
  region text,
  phone text,
  hours text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.health_facilities TO anon, authenticated;
GRANT ALL ON public.health_facilities TO service_role;
ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY hf_select_all ON public.health_facilities FOR SELECT USING (true);
CREATE POLICY hf_admin_all ON public.health_facilities FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_hf_region ON public.health_facilities(region);
CREATE INDEX idx_hf_type ON public.health_facilities(type);

-- Seed: établissements emblématiques au Sénégal
INSERT INTO public.health_facilities (name,type,address,city,region,phone,hours,lat,lng) VALUES
('Hôpital Principal de Dakar','hospital','1 Av. Nelson Mandela','Dakar','Dakar','+221 33 839 50 50','24/7',14.6661,-17.4329),
('Hôpital Aristide Le Dantec','hospital','Av. Pasteur','Dakar','Dakar','+221 33 839 52 00','24/7',14.6708,-17.4395),
('Hôpital Fann','hospital','Av. Cheikh Anta Diop','Dakar','Dakar','+221 33 869 18 18','24/7',14.6905,-17.4625),
('CHU de Fann','hospital','Fann','Dakar','Dakar','+221 33 869 18 18','24/7',14.6920,-17.4640),
('Hôpital Régional de Thiès','hospital','Thiès','Thiès','Thiès','+221 33 951 11 04','24/7',14.7886,-16.9260),
('Hôpital Régional de Saint-Louis','hospital','Saint-Louis','Saint-Louis','Saint-Louis','+221 33 961 10 25','24/7',16.0326,-16.4818),
('Hôpital Régional de Ziguinchor','hospital','Ziguinchor','Ziguinchor','Ziguinchor','+221 33 991 11 38','24/7',12.5833,-16.2719),
('Hôpital Régional de Kaolack','hospital','Kaolack','Kaolack','Kaolack','+221 33 941 10 24','24/7',14.1500,-16.0667),
('Hôpital Régional de Tambacounda','hospital','Tambacounda','Tambacounda','Tambacounda','+221 33 981 10 24','24/7',13.7707,-13.6673),
('Centre de Santé de Pikine','health_center','Pikine','Pikine','Dakar','+221 33 834 12 00','08:00-18:00',14.7547,-17.3962),
('Centre de Santé de Guédiawaye','health_center','Guédiawaye','Guédiawaye','Dakar','+221 33 837 50 00','08:00-18:00',14.7693,-17.4103),
('Centre de Santé de Rufisque','health_center','Rufisque','Rufisque','Dakar','+221 33 836 10 00','08:00-18:00',14.7167,-17.2667),
('Centre de Santé de Mbour','health_center','Mbour','Mbour','Thiès','+221 33 957 10 00','08:00-18:00',14.4198,-16.9647),
('Centre de Santé de Touba','health_center','Touba','Touba','Diourbel','+221 33 978 10 00','08:00-18:00',14.8500,-15.8833),
('Centre de Santé de Louga','health_center','Louga','Louga','Louga','+221 33 967 10 00','08:00-18:00',15.6173,-16.2240),
('Centre de Santé de Kolda','health_center','Kolda','Kolda','Kolda','+221 33 996 10 00','08:00-18:00',12.8939,-14.9407),
('Poste de Santé de Yoff','health_post','Yoff','Dakar','Dakar','+221 33 820 00 00','08:00-17:00',14.7456,-17.4934),
('Poste de Santé de Ngor','health_post','Ngor','Dakar','Dakar','+221 33 820 10 00','08:00-17:00',14.7472,-17.5125),
('Poste de Santé de Bambey','health_post','Bambey','Bambey','Diourbel','+221 33 972 10 00','08:00-17:00',14.7000,-16.4667),
('Poste de Santé de Fatick','health_post','Fatick','Fatick','Fatick','+221 33 949 10 00','08:00-17:00',14.3333,-16.4167),
('Poste de Santé de Matam','health_post','Matam','Matam','Matam','+221 33 966 10 00','08:00-17:00',15.6559,-13.2554),
('Pharmacie du Plateau','pharmacy','Av. Léopold Sédar Senghor','Dakar','Dakar','+221 33 821 31 21','08:00-22:00',14.6708,-17.4395),
('Pharmacie Mermoz','pharmacy','Mermoz','Dakar','Dakar','+221 33 860 10 10','08:00-22:00',14.7194,-17.4647),
('Pharmacie de Thiès','pharmacy','Centre-ville','Thiès','Thiès','+221 33 951 20 20','08:00-22:00',14.7886,-16.9260),
('Pharmacie de Saint-Louis','pharmacy','Centre-ville','Saint-Louis','Saint-Louis','+221 33 961 20 20','08:00-22:00',16.0326,-16.4818);

-- ============ NOTIFICATIONS: allow trigger inserts ============
-- Service role + triggers can insert; users can mark as read (already exists)
CREATE POLICY notif_insert_system ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Auto-notification triggers
CREATE OR REPLACE FUNCTION public.notify_appointment_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doctor_name text;
  v_patient_name text;
BEGIN
  SELECT full_name INTO v_doctor_name FROM profiles WHERE id = NEW.doctor_id;
  SELECT full_name INTO v_patient_name FROM profiles WHERE id = NEW.patient_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications(user_id,title,body,link) VALUES
      (NEW.doctor_id,'Nouvelle demande de rendez-vous',
       'Patient: '||COALESCE(v_patient_name,'?')||' — '||to_char(NEW.scheduled_at,'DD/MM/YYYY HH24:MI'),
       '/medecin/agenda'),
      (NEW.patient_id,'Rendez-vous créé',
       'Avec Dr '||COALESCE(v_doctor_name,'?')||' — '||to_char(NEW.scheduled_at,'DD/MM/YYYY HH24:MI'),
       '/patient/appointments');
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO notifications(user_id,title,body,link) VALUES
      (NEW.patient_id,
       CASE NEW.status::text
         WHEN 'confirmed' THEN 'Rendez-vous confirmé'
         WHEN 'cancelled' THEN 'Rendez-vous annulé'
         WHEN 'completed' THEN 'Consultation terminée'
         ELSE 'Statut du rendez-vous modifié' END,
       'Avec Dr '||COALESCE(v_doctor_name,'?')||' — '||to_char(NEW.scheduled_at,'DD/MM/YYYY HH24:MI'),
       '/patient/appointments');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_appointment
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_event();

CREATE OR REPLACE FUNCTION public.notify_prescription_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doctor_name text;
BEGIN
  SELECT full_name INTO v_doctor_name FROM profiles WHERE id = NEW.doctor_id;
  INSERT INTO notifications(user_id,title,body,link) VALUES
    (NEW.patient_id,'Nouvelle ordonnance disponible',
     'Émise par Dr '||COALESCE(v_doctor_name,'?'),
     '/patient/prescriptions');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_prescription
AFTER INSERT ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.notify_prescription_created();

CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sender text;
BEGIN
  SELECT full_name INTO v_sender FROM profiles WHERE id = NEW.sender_id;
  INSERT INTO notifications(user_id,title,body,link) VALUES
    (NEW.recipient_id,'Nouveau message',
     'De '||COALESCE(v_sender,'?')||': '||substr(NEW.content,1,80),
     '/patient/messages');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message_received();

-- Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
