import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).default("login").catch("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Connexion — MediRural" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "admin" ? "/admin" : role === "doctor" ? "/medecin" : "/patient" });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero px-6 py-10">
      <div className="absolute inset-0 bg-mesh opacity-50" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="rounded-3xl border border-border bg-card/95 p-8 shadow-elevated backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-display text-xl">MediRural</p>
              <p className="text-xs text-muted-foreground">Espace sécurisé</p>
            </div>
          </div>

          <Tabs defaultValue={mode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Au moins 6 caractères"),
});

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Identifiants invalides" : error.message);
      return;
    }
    toast.success("Connexion réussie");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Mot de passe</Label>
        <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-soft">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  );
}

const signupSchema = z.object({
  full_name: z.string().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
  role: z.enum(["patient", "doctor"]),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  specialty: z.string().max(100).optional(),
  license_number: z.string().max(100).optional(),
});

function SignupForm() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [specialty, setSpecialty] = useState("");
  const [license_number, setLicense] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ full_name, email, password, role, phone, city, specialty, license_number });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (role === "doctor" && (!specialty || !license_number)) {
      toast.error("Spécialité et numéro de licence requis");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          city: parsed.data.city,
          role: parsed.data.role,
          specialty: parsed.data.specialty,
          license_number: parsed.data.license_number,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      role === "doctor"
        ? "Compte créé. En attente de validation par un administrateur."
        : "Compte créé. Bienvenue !",
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Je suis</Label>
        <Select value={role} onValueChange={(v) => setRole(v as "patient" | "doctor")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="patient">Patient</SelectItem>
            <SelectItem value="doctor">Médecin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-name">Nom complet</Label>
        <Input id="su-name" value={full_name} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="su-email">Email</Label>
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-pwd">Mot de passe</Label>
          <Input id="su-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="su-phone">Téléphone</Label>
          <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-city">Ville</Label>
          <Input id="su-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
        </div>
      </div>
      {role === "doctor" && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-3">
          <div className="space-y-2">
            <Label htmlFor="su-spec">Spécialité</Label>
            <Input id="su-spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} maxLength={100} placeholder="Ex. Cardiologie" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="su-lic">N° licence</Label>
            <Input id="su-lic" value={license_number} onChange={(e) => setLicense(e.target.value)} maxLength={100} />
          </div>
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-soft">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer mon compte
      </Button>
    </form>
  );
}
