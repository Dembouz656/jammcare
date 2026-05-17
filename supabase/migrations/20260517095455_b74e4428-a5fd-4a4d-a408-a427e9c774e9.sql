CREATE OR REPLACE FUNCTION public.validate_doctor_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'L''heure de fin doit être postérieure à l''heure de début';
  END IF;
  IF NEW.slot_minutes < 5 OR NEW.slot_minutes > 240 THEN
    RAISE EXCEPTION 'La durée d''un créneau doit être comprise entre 5 et 240 minutes';
  END IF;
  IF NEW.weekday < 0 OR NEW.weekday > 6 THEN
    RAISE EXCEPTION 'Jour de la semaine invalide';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.doctor_availability d
    WHERE d.doctor_id = NEW.doctor_id
      AND d.weekday = NEW.weekday
      AND d.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND d.start_time < NEW.end_time
      AND d.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Cette plage chevauche une disponibilité existante';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_doctor_availability ON public.doctor_availability;
CREATE TRIGGER trg_validate_doctor_availability
BEFORE INSERT OR UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.validate_doctor_availability();