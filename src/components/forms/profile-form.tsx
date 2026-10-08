"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, FileText } from "lucide-react";
import { saveProfile } from "@/app/actions/mutations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";

type ProfileFormProps = {
  profile: { name: string | null; username: string | null; headline: string | null; bio: string | null; image: string | null; cvUpdatedAt: Date | null };
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction] = useActionState(saveProfile, null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shownImage = preview ?? (removed ? null : profile.image);
  const initials = (profile.name || profile.username || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Free the object URL of the previous preview.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Base UI inputs warn if their defaultValue changes after mount, which happens when a save
  // refreshes the page with new values. Keying on the saved values remounts them instead.
  const savedKey = [profile.name, profile.username, profile.headline, profile.bio, profile.cvUpdatedAt?.getTime()].join("\u0000");

  return (
    <form key={savedKey} action={formAction} className="space-y-6 max-w-xl">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Change profile picture"
        >
          <Avatar className="h-20 w-20 text-xl">
            {shownImage && <AvatarImage src={shownImage} alt="Profile picture" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Profile picture</p>
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => fileRef.current?.click()} className="font-medium underline-offset-4 hover:underline">
              Upload new
            </button>
            {shownImage && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setRemoved(true);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP or GIF, up to 2 MB. Square images look best.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
            setRemoved(false);
          }}
        />
        {removed && <input type="hidden" name="removeAvatar" value="on" />}
      </div>

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
        <Input id="headline" name="headline" defaultValue={profile.headline ?? ""} maxLength={120} placeholder="Backend engineer, AWS Certified Solutions Architect" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={5} defaultValue={profile.bio ?? ""} maxLength={1000} placeholder="A few lines about you, shown at the top of your profile." />
      </div>

      <CvField username={profile.username} cvUpdatedAt={profile.cvUpdatedAt} />

      <div className="pt-4 border-t flex justify-end">
        <SubmitButton>Save profile</SubmitButton>
      </div>
    </form>
  );
}

// Lives inside the keyed form, so a save that changes the CV remounts it and clears the
// picked file name.
function CvField({ username, cvUpdatedAt }: { username: string | null; cvUpdatedAt: Date | null }) {
  const cvRef = useRef<HTMLInputElement>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const [cvRemoved, setCvRemoved] = useState(false);
  const hasSavedCv = !!cvUpdatedAt && !cvRemoved;

  return (
    <div className="space-y-2">
      <Label>CV</Label>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 text-sm">
          {cvName ? (
            <p className="truncate font-medium">{cvName}</p>
          ) : hasSavedCv && username ? (
            <a
              href={`/api/cv/${username}?v=${cvUpdatedAt!.getTime()}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              Your CV (uploaded {cvUpdatedAt!.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })})
            </a>
          ) : (
            <p className="text-muted-foreground">No CV uploaded</p>
          )}
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <button type="button" onClick={() => cvRef.current?.click()} className="font-medium underline-offset-4 hover:underline">
            {cvName || hasSavedCv ? "Replace" : "Upload"}
          </button>
          {(cvName || hasSavedCv) && (
            <button
              type="button"
              onClick={() => {
                setCvName(null);
                setCvRemoved(true);
                if (cvRef.current) cvRef.current.value = "";
              }}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">PDF, up to 5 MB. Anyone visiting your profile can download it.</p>
      <input
        ref={cvRef}
        type="file"
        name="cv"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setCvName(file.name);
          setCvRemoved(false);
        }}
      />
      {cvRemoved && cvUpdatedAt && <input type="hidden" name="removeCv" value="on" />}
    </div>
  );
}
