import { UserProfile } from "@clerk/clerk-react";

const UserProfilePage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        <div className="glass-card p-0 rounded-lg overflow-hidden">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none",
                navbar: "bg-secondary/10 border-b border-secondary/20",
                navbarButton: "text-foreground hover:text-primary",
                pageScrollBox: "p-6",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
                formFieldInput: "bg-secondary/10 border-secondary/20",
                formFieldLabel: "text-foreground",
                accordionTriggerButton: "text-foreground hover:text-primary",
                profileSectionTitleText: "text-foreground",
                profileSectionSubtitle: "text-muted-foreground",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                dividerLine: "bg-secondary/20",
                formFieldSuccessText: "text-success",
                formFieldErrorText: "text-destructive",
                alertText: "text-foreground",
                alertTextDanger: "text-destructive",
              },
              layout: {
                logoPlacement: "none",
                logoImageUrl: "",
              },
            }}
            path="/user"
            routing="path"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 