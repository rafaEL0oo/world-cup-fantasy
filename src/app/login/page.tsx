import { Trophy } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-background px-4 dark:from-emerald-950/30">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          <Trophy className="size-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          World Cup Predictor League
        </h1>
        <p className="max-w-sm text-muted-foreground">
          Predict match results, compete with friends, and climb the leaderboard.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your Google account to join private leagues and make predictions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Authentication failed. Please try again.
              </AlertDescription>
            </Alert>
          )}
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
