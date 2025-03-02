import React, { ReactNode, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ServiceDependentContentProps {
  children: ReactNode;
  serviceName: string;
  errorFallback?: ReactNode;
}

/**
 * A component that wraps content that depends on a service being available.
 * If the service is not available, it shows an error message or a custom fallback.
 */
const ServiceDependentContent: React.FC<ServiceDependentContentProps> = ({
  children,
  serviceName,
  errorFallback,
}) => {
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a real implementation, this would check if the service is available
    // For now, we'll assume it's available
    const checkServiceAvailability = async () => {
      try {
        // This is a placeholder for actual service availability check
        // In a real implementation, you might make an API call to check
        setIsLoading(false);
        setIsServiceAvailable(true);
      } catch (error) {
        console.error(`Error checking ${serviceName} availability:`, error);
        setIsLoading(false);
        setIsServiceAvailable(false);
      }
    };

    checkServiceAvailability();
  }, [serviceName]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking {serviceName} Connection</CardTitle>
          <CardDescription>
            Please wait while we verify the connection...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isServiceAvailable) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Service Unavailable</AlertTitle>
        <AlertDescription>
          {serviceName} is currently unavailable. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default ServiceDependentContent; 