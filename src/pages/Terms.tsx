import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-white">Terms and Conditions</h1>
          
          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Icebreaker-AI Powered Networking, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Eligibility</h2>
              <p>
                This service is available only to users with valid ISM University email addresses (@ism.lt, @stud.ism.lt, @faculty.ism.lt). You must be at least 18 years old to use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. User Conduct</h2>
              <p className="mb-4">
                You agree to use the service only for lawful purposes. You must not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Harass, abuse, or harm other users</li>
                <li>Provide false or misleading information</li>
                <li>Use the service for commercial purposes without authorization</li>
                <li>Attempt to gain unauthorized access to the service</li>
                <li>Share inappropriate or offensive content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the service are owned by Icebreaker Inc. and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Disclaimer of Warranties</h2>
              <p>
                The service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Icebreaker Inc. shall not be liable for any indirect, incidental, special, or consequential damages arising out of or related to your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at support@icebreaker.ai
              </p>
            </section>

            <p className="text-sm text-slate-400 mt-12">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
