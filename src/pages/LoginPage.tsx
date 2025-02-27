import { SignIn } from "@clerk/clerk-react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Welcome to Crypto Hub</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your account</p>
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
              formFieldLabelRow: "flex justify-between items-center",
              identityPreviewText: "text-sm text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formFieldWarning: "text-yellow-500 text-sm mt-1",
              formFieldError: "text-red-500 text-sm mt-1",
              alertText: "text-red-500 text-sm",
              headerBackIcon: "text-primary hover:text-primary/80",
              headerBackLink: "text-primary hover:text-primary/80",
              otpCodeFieldInput: "w-12 h-12 border border-secondary/20 rounded-lg bg-secondary/10 text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            },
            layout: {
              socialButtonsPlacement: "bottom",
              showOptionalFields: false
            }
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage; 