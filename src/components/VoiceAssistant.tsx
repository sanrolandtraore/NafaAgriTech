import React from "react";

type VoiceResult = {
  intent: string;
  response_message: string;
  service_data?: {
    service_type?: string;
    description?: string;
    location?: string;
    preferred_date?: string;
    phone?: string;
  };
  equipment_data?: {
    equipment_type?: string;
    search_query?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
  };
  navigation?: string;
};

type VoiceAssistantProps = {
  onServiceRequest?: (data: VoiceResult["service_data"]) => void;
  onEquipmentSearch?: (data: VoiceResult["equipment_data"]) => void;
};

/**
 * VoiceAssistant désactivé suite à la demande de retrait du microphone sur la plateforme.
 */
const VoiceAssistant = (_props: VoiceAssistantProps) => {
  return null;
};

export default VoiceAssistant;
