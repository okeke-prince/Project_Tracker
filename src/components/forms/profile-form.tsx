"use client";

import { useActionState, useEffect } from "react";
import { saveProfile } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";

type ProfileFormProps = {
  profile: { name: string | null; username: string | null; headline: string | null; bio: string | null };
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction] = useActionState(saveProfile, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" defaultValue={profile.name ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input id="username" name="username" defaultValue={profile.username ?? ""} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9-]+" />
        <p className="text-xs text-muted-foreground">Your public profile lives at /{profile.username || "your-username"}. Changing this changes the link.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" name="headline" defaultValue={profile.headline ?? ""} maxLength={120} placeholder="Backend engineer · AWS Certified Solutions Architect" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={5} defaultValue={profile.bio ?? ""} maxLength={1000} placeholder="A few lines about you, shown at the top of your profile." />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>Save Profile</SubmitButton>
      </div>
    </form>
  );
}
