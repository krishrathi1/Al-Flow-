import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-background p-4 pt-10 md:pt-20">
      <Card className="w-full max-w-2xl shadow-2xl bg-card/50">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-transparent">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account, subscription, and security settings.
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="size-5 text-accent" />
                <span>Subscription Plan</span>
              </h3>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-muted-foreground">Free Tier - 100 credits/month</p>
                </div>
                <Button>Upgrade to Pro</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                 <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">user@example.com</p>
                </div>
                <Button variant="outline">Change Email</Button>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                  <Trash2 className="size-5" />
                  <span>Danger Zone</span>
              </h3>
              <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                 <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <Button variant="destructive">Delete My Account</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
