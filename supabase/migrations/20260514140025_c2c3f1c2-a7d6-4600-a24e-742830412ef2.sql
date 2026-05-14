
-- Update handle_new_user to auto-promote a specific email to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_role_text TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city'
  );

  v_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  IF v_role_text NOT IN ('patient','doctor','admin') THEN v_role_text := 'patient'; END IF;
  IF v_role_text = 'admin' THEN v_role_text := 'patient'; END IF;

  -- Auto-promote owner email
  IF lower(NEW.email) = 'elimanewilsontoure22@gmail.com' THEN
    v_role_text := 'admin';
  END IF;

  v_role := v_role_text::public.app_role;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  IF v_role = 'patient' THEN
    INSERT INTO public.patients (id) VALUES (NEW.id);
  ELSIF v_role = 'doctor' THEN
    INSERT INTO public.doctors (id, specialty, license_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'Médecine générale'),
      COALESCE(NEW.raw_user_meta_data->>'license_number', 'PENDING-' || NEW.id::text)
    );
  END IF;

  RETURN NEW;
END $function$;

-- Doctor weekly availability
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avail_doctor ON public.doctor_availability(doctor_id, weekday);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY avail_select_all ON public.doctor_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY avail_insert_doctor ON public.doctor_availability FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY avail_update_doctor ON public.doctor_availability FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY avail_delete_doctor ON public.doctor_availability FOR DELETE USING (auth.uid() = doctor_id OR has_role(auth.uid(), 'admin'));

-- Realtime for messages and appointments (for WebRTC signaling and updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
