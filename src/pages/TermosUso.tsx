import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-8 space-y-6">
        <BackButton className="mb-2" />
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições de Uso da Plataforma</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: 03 de Fevereiro de 2026
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h2 className="text-lg font-semibold mb-2">1. Aceitação dos Termos</h2>
                  <p>
                    Ao acessar e utilizar a plataforma A Boa, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">2. Elegibilidade</h2>
                  <p>
                    Para utilizar nossa plataforma, você deve:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ter pelo menos 18 anos de idade</li>
                    <li>Possuir CPF válido e regular</li>
                    <li>Ser residente no Brasil</li>
                    <li>Fornecer informações verdadeiras e precisas durante o cadastro</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">3. Cadastro e Conta</h2>
                  <p>
                    Você é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada em sua conta será de sua responsabilidade. Notifique-nos imediatamente sobre qualquer uso não autorizado.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">4. Sorteios e Raspadinhas</h2>
                  <p>
                    Os sorteios e raspadinhas disponíveis na plataforma são realizados de forma transparente e auditável. Os resultados são gerados de maneira aleatória e imparcial. Ao participar:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Você aceita que os resultados são definitivos e irrevogáveis</li>
                    <li>Reconhece que a participação não garante prêmios</li>
                    <li>Concorda em fornecer dados para entrega de prêmios, se aplicável</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">5. Pagamentos e Reembolsos</h2>
                  <p>
                    Todos os pagamentos são processados via PIX. Após a confirmação do pagamento, os créditos são disponibilizados automaticamente em sua carteira. Não são permitidos reembolsos após a participação em sorteios ou uso de raspadinhas.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">6. Saques</h2>
                  <p>
                    O saque de valores da carteira está sujeito às seguintes condições:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Valor mínimo para saque: R$ 10,00</li>
                    <li>Saldos de bônus não são sacáveis</li>
                    <li>Prazo de processamento: até 5 dias úteis</li>
                    <li>A chave PIX deve estar em nome do titular da conta</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">7. Programa de Afiliados</h2>
                  <p>
                    Usuários aprovados como afiliados podem divulgar a plataforma e receber comissões por vendas realizadas através de seus links. As comissões são calculadas conforme as regras vigentes e estão sujeitas a verificação.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">8. Condutas Proibidas</h2>
                  <p>
                    É expressamente proibido:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Criar múltiplas contas</li>
                    <li>Utilizar bots ou automação</li>
                    <li>Manipular ou tentar manipular resultados</li>
                    <li>Fornecer informações falsas</li>
                    <li>Violar leis aplicáveis</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">9. Suspensão e Encerramento</h2>
                  <p>
                    Reservamos o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio. Em casos de fraude, os saldos podem ser retidos e as autoridades competentes notificadas.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">10. Limitação de Responsabilidade</h2>
                  <p>
                    A plataforma não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso dos serviços. Nosso uso é por sua conta e risco.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">11. Alterações nos Termos</h2>
                  <p>
                    Podemos modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado da plataforma constitui aceitação dos novos termos.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">12. Contato</h2>
                  <p>
                    Em caso de dúvidas sobre estes termos, entre em contato através da nossa central de suporte ou pelo e-mail contato@aboa.com.br.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
