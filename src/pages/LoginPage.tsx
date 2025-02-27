import { SignIn } from "@clerk/clerk-react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-lg shadow-lg backdrop-blur-md bg-background/30 border border-white/10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Crypto Hub</h1>
          <p className="text-muted-foreground">Sign in to access your account</p>
        </div>

        <SignIn 
          routing="path" 
          path="/c-817085/login"
          redirectUrl="/c-817085"
          afterSignInUrl="/c-817085/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg transition-colors",
              formFieldInput: "w-full px-4 py-3 border border-secondary/20 rounded-lg bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
              formFieldLabel: "text-sm font-medium text-foreground mb-2 block",
              footerAction: "text-primary hover:text-primary/80",
              dividerLine: "bg-secondary/20",
              dividerText: "text-muted-foreground",
              socialButtonsBlockButton: "w-full border border-secondary/20 hover:bg-secondary/10 text-foreground py-3 px-4 rounded-lg transition-colors",
              socialButtonsBlockButtonText: "text-sm font-medium",
              socialButtonsProviderIcon: "w-5 h-5",
              formFieldAction: "text-primary hover:text-primary/80",
              otpCodeFieldInput: "!w-12 !h-12 !text-lg font-medium border border-secondary/20 rounded-lg bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formResendCodeLink: "text-primary hover:text-primary/80",
              alert: "bg-secondary/10 border border-secondary/20 rounded-lg p-4",
              alertText: "text-foreground",
              // Hide development mode badge
              badge: "hidden",
              navbar: "hidden",
              navbarButton: "hidden",
              header: "mb-8",
              card: {
                boxShadow: "none",
                backgroundColor: "transparent"
              }
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
              showOptionalFields: false,
              logoPlacement: "none"
            }
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage; 