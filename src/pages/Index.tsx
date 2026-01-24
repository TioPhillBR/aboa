import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Ticket, Gift, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="container relative py-24 md:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              A plataforma de sorteios mais emocionante!
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Participe de{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                sorteios incríveis
              </span>{' '}
              e ganhe prêmios
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl">
              Compre seus números, acompanhe a roleta girar e veja se a sorte está do seu lado. 
              Também temos raspadinhas virtuais para diversão instantânea!
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link to="/sorteios">
                  Ver Sorteios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/raspadinhas">
                  Jogar Raspadinhas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Participar é simples e seguro. Cadastre-se, carregue créditos e comece a jogar!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Cadastre-se</CardTitle>
              <CardDescription>
                Crie sua conta gratuita em segundos e adicione sua foto de perfil
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. Carregue Créditos</CardTitle>
              <CardDescription>
                Adicione créditos à sua carteira de forma rápida e segura
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>3. Compre Números</CardTitle>
              <CardDescription>
                Escolha seus números da sorte nos sorteios ou compre raspadinhas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>4. Ganhe Prêmios</CardTitle>
              <CardDescription>
                Acompanhe o sorteio ao vivo e torça para ser o grande vencedor!
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border">
            <div>
              <h3 className="text-2xl font-bold mb-2">Pronto para tentar a sorte?</h3>
              <p className="text-muted-foreground">
                Cadastre-se agora e ganhe bônus de boas-vindas na sua primeira recarga!
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/cadastro">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold">Sorteio</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Sorteio. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
