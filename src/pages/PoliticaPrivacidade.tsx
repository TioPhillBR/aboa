import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-8 space-y-6">
        <BackButton className="mb-2" />
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Política de Privacidade e Proteção de Dados</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: 03 de Fevereiro de 2026
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h2 className="text-lg font-semibold mb-2">1. Introdução</h2>
                  <p>
                    Esta Política de Privacidade descreve como a plataforma A Boa coleta, usa, armazena e protege suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">2. Dados Coletados</h2>
                  <p>Coletamos os seguintes tipos de dados:</p>
                  
                  <h3 className="font-medium mt-3 mb-1">2.1 Dados de Identificação</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Nome completo</li>
                    <li>CPF</li>
                    <li>Data de nascimento</li>
                    <li>Endereço de e-mail</li>
                    <li>Número de telefone (WhatsApp)</li>
                    <li>Endereço completo</li>
                    <li>Foto de perfil (opcional)</li>
                  </ul>

                  <h3 className="font-medium mt-3 mb-1">2.2 Dados de Uso</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Histórico de participações em sorteios</li>
                    <li>Histórico de compras de raspadinhas</li>
                    <li>Transações financeiras na plataforma</li>
                    <li>Interações com o suporte</li>
                  </ul>

                  <h3 className="font-medium mt-3 mb-1">2.3 Dados Técnicos</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Endereço IP</li>
                    <li>Tipo de dispositivo e navegador</li>
                    <li>Data e hora de acesso</li>
                    <li>Páginas visitadas</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">3. Finalidade do Tratamento</h2>
                  <p>Utilizamos seus dados para:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Criar e gerenciar sua conta na plataforma</li>
                    <li>Processar participações em sorteios e raspadinhas</li>
                    <li>Realizar pagamentos e transferências</li>
                    <li>Entregar prêmios aos ganhadores</li>
                    <li>Enviar comunicações sobre sua conta e serviços</li>
                    <li>Prevenir fraudes e garantir a segurança</li>
                    <li>Cumprir obrigações legais e regulatórias</li>
                    <li>Melhorar nossos serviços e experiência do usuário</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">4. Base Legal</h2>
                  <p>O tratamento de dados é realizado com base em:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Consentimento:</strong> Fornecido no momento do cadastro</li>
                    <li><strong>Execução de contrato:</strong> Para prestação dos serviços</li>
                    <li><strong>Cumprimento de obrigação legal:</strong> Quando exigido por lei</li>
                    <li><strong>Interesse legítimo:</strong> Para prevenção de fraudes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">5. Compartilhamento de Dados</h2>
                  <p>Podemos compartilhar seus dados com:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Processadores de pagamento (para transações financeiras)</li>
                    <li>Prestadores de serviços (hospedagem, e-mail, etc.)</li>
                    <li>Autoridades governamentais (quando exigido por lei)</li>
                    <li>Parceiros de entrega (para envio de prêmios físicos)</li>
                  </ul>
                  <p className="mt-2">
                    Não vendemos ou alugamos seus dados pessoais a terceiros para fins de marketing.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">6. Armazenamento e Segurança</h2>
                  <p>
                    Seus dados são armazenados em servidores seguros com criptografia. Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição.
                  </p>
                  <p className="mt-2">
                    Os dados são retidos pelo tempo necessário para cumprir as finalidades descritas ou conforme exigido por lei (mínimo de 5 anos para dados fiscais).
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">7. Seus Direitos (LGPD)</h2>
                  <p>Você tem direito a:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Confirmação:</strong> Saber se tratamos seus dados</li>
                    <li><strong>Acesso:</strong> Obter cópia dos seus dados</li>
                    <li><strong>Correção:</strong> Atualizar dados incompletos ou incorretos</li>
                    <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
                    <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                    <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com consentimento</li>
                    <li><strong>Revogação:</strong> Retirar seu consentimento a qualquer momento</li>
                    <li><strong>Oposição:</strong> Se opor a tratamento irregular</li>
                  </ul>
                  <p className="mt-2">
                    Para exercer seus direitos, entre em contato através da nossa central de suporte.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">8. Cookies</h2>
                  <p>
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">9. Menores de Idade</h2>
                  <p>
                    Nossa plataforma é destinada exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Se identificarmos tal situação, os dados serão imediatamente eliminados.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">10. Alterações nesta Política</h2>
                  <p>
                    Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas por e-mail ou através da plataforma. Recomendamos revisar esta página regularmente.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">11. Encarregado de Dados (DPO)</h2>
                  <p>
                    Para questões relacionadas à proteção de dados, entre em contato com nosso Encarregado de Dados através do e-mail: privacidade@aboa.com.br
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-2">12. Contato</h2>
                  <p>
                    Em caso de dúvidas sobre esta política ou sobre o tratamento de seus dados, entre em contato:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>E-mail: contato@aboa.com.br</li>
                    <li>Central de Suporte: através da plataforma</li>
                  </ul>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
