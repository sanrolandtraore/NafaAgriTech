import React from "react";

interface InspectionVoiceRecorderProps {
  initialTranscription?: string | null;
  onSaveTranscription?: (text: string) => void;
  onVoiceRecorded?: (hasAudio: boolean) => void;
}

/**
 * InspectionVoiceRecorder désactivé suite au retrait du microphone sur la plateforme.
 */
export default function InspectionVoiceRecorder(_props: InspectionVoiceRecorderProps) {
  return null;
}
