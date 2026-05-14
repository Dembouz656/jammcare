
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.doctor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============= USER_ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'doctor' THEN 2 ELSE 3 END LIMIT 1
$$;

-- ============= DOCTORS =============
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  bio TEXT,
  years_experience INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  languages TEXT[] DEFAULT ARRAY['Français'],
  status public.doctor_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_doctors_status ON public.doctors(status);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);

-- ============= PATIENTS =============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender public.gender,
  blood_type TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ============= APPOINTMENTS =============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  reason TEXT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appt_patient ON public.appointments(patient_id, scheduled_at DESC);
CREATE INDEX idx_appt_doctor ON public.appointments(doctor_id, scheduled_at DESC);
CREATE INDEX idx_appt_status ON public.appointments(status);

-- ============= CONSULTATIONS =============
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  diagnosis TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_consult_patient ON public.consultations(patient_id);
CREATE INDEX idx_consult_doctor ON public.consultations(doctor_id);

-- ============= MESSAGES =============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_msg_pair ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_msg_recipient ON public.messages(recipient_id, created_at DESC);

-- ============= PRESCRIPTIONS =============
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_presc_patient ON public.prescriptions(patient_id, issued_at DESC);
CREATE INDEX idx_presc_doctor ON public.prescriptions(doctor_id, issued_at DESC);

-- ============= MEDICAL_RECORDS =============
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  record_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mr_patient ON public.medical_records(patient_id, created_at DESC);

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  -- never let signup self-grant admin
  IF v_role_text = 'admin' THEN v_role_text := 'patient'; END IF;
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
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= RLS POLICIES =============

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_select_doctor" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles (read-only for users; only admins manage)
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- doctors
CREATE POLICY "doctors_select_all_authenticated" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "doctors_update_own" ON public.doctors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "doctors_admin_all" ON public.doctors FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- patients
CREATE POLICY "patients_select_own" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "patients_select_treating_doctor" ON public.patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = patients.id AND a.doctor_id = auth.uid())
);
CREATE POLICY "patients_select_admin" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE USING (auth.uid() = id);

-- appointments
CREATE POLICY "appt_select_involved" ON public.appointments FOR SELECT USING (auth.uid() IN (patient_id, doctor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "appt_insert_patient" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "appt_update_involved" ON public.appointments FOR UPDATE USING (auth.uid() IN (patient_id, doctor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "appt_delete_admin" ON public.appointments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- consultations
CREATE POLICY "consult_select_involved" ON public.consultations FOR SELECT USING (auth.uid() IN (patient_id, doctor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "consult_insert_doctor" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "consult_update_doctor" ON public.consultations FOR UPDATE USING (auth.uid() = doctor_id);

-- messages
CREATE POLICY "msg_select_involved" ON public.messages FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "msg_insert_sender" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update_recipient" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- prescriptions
CREATE POLICY "presc_select_involved" ON public.prescriptions FOR SELECT USING (auth.uid() IN (patient_id, doctor_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "presc_insert_doctor" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- medical_records
CREATE POLICY "mr_select_involved" ON public.medical_records FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mr_insert_doctor_or_self" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- notifications
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
