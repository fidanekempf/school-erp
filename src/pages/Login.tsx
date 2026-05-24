import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import { storage } from '@/lib/storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const success = login(email, password);
    
    if (success) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      
      // Redirect based on role
      const users = storage.getUsers();
      const user = users.find(u => u.email === email);
      
      if (user?.role === 'parent') {
        navigate('/parent-dashboard');
      } else if (user?.role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/');
      }
    } else {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">École Management</CardTitle>
            <CardDescription className="mt-2">
              Connectez-vous à votre compte
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@ecole.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">Comptes de démonstration :</p>
            <div className="space-y-1">
              <p><strong>Administrateur :</strong> admin@ecole.fr / admin123</p>
              <p><strong>Professeur :</strong> prof.martin@ecole.fr / prof123</p>
              <p><strong>Élève :</strong> emma.dubois@eleve.fr / eleve123</p>
              <p><strong>Parent :</strong> parent.dubois@email.fr / parent123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
