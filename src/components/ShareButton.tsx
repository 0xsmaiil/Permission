import { ShareNetwork, CopySimple } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

interface ShareDataProps {
  leaveType: string;
  startDate: string;
  duration: number;
  returnDate: string;
  resumeDate: string;
}

export function ShareButton({ data }: { data: ShareDataProps }) {
  const t = useT();

  const handleShare = async () => {
    const shareText = t("share.body", {
      leaveType: data.leaveType,
      startDate: data.startDate,
      duration: data.duration,
      returnDate: data.returnDate,
      resumeDate: data.resumeDate,
    });

    if (navigator.share && navigator.canShare({ text: shareText })) {
      try {
        await navigator.share({ title: t("share.title"), text: shareText });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast(t("share.copied"));
      } catch {}
    }
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="flex-1 h-10 rounded-lg text-sm font-semibold border-border/80"
    >
      {canShare ? (
        <ShareNetwork className="me-1.5 h-3.5 w-3.5" />
      ) : (
        <CopySimple className="me-1.5 h-3.5 w-3.5" />
      )}
      {canShare ? t("share.button") : t("share.copy")}
    </Button>
  );
}
