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
        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center rounded-full border px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-medium bg-primary/10 text-primary">
              <Sparkles className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              A plataforma de sorteios mais emocionante!
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl px-2">
              Participe de{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                sorteios incríveis
              </span>{' '}
              e ganhe prêmios
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl px-4">
              Compre seus números, acompanhe a roleta girar e veja se a sorte está do seu lado. 
              Também temos raspadinhas virtuais para diversão instantânea!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/sorteios">
                  Ver Sorteios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/raspadinhas">
                  Jogar Raspadinhas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-10 md:mb-16 px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Como Funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Participar é simples e seguro. Cadastre-se, carregue créditos e comece a jogar!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">1. Cadastre-se</CardTitle>
              <CardDescription className="text-sm">
                Crie sua conta gratuita em segundos e adicione sua foto de perfil
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <Gift className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">2. Carregue Créditos</CardTitle>
              <CardDescription className="text-sm">
                Adicione créditos à sua carteira de forma rápida e segura
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <Ticket className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">3. Compre Números</CardTitle>
              <CardDescription className="text-sm">
                Escolha seus números da sorte nos sorteios ou compre raspadinhas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">4. Ganhe Prêmios</CardTitle>
              <CardDescription className="text-sm">
                Acompanhe o sorteio ao vivo e torça para ser o grande vencedor!
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Pronto para tentar a sorte?</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Cadastre-se agora e ganhe bônus de boas-vindas na sua primeira recarga!
              </p>
            </div>
            <Button size="lg" asChild className="w-full md:w-auto shrink-0">
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
