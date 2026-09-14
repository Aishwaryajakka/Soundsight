import type React from 'react';
import {
  Bell,
  DoorClosed,
  Volume2,
  Microwave,
  Car,
  Flame,
  Baby,
  Siren,
  ShieldAlert,
  Coffee,
  AlertCircle,
  Radio,
  Sparkles,
  Zap,
  Phone,
  Droplets,
  Wind,
  Music2,
  Footprints,
  Hand,
  AudioLines,
  Dog,
  GlassWater,
  CarFront,
} from 'lucide-react-native';
import type { SoundType } from '@/types/sound';

interface SoundIconProps {
  name?: string;
  soundType?: SoundType;
  size?: number;
  color?: string;
  className?: string;
}

export const SoundIcon: React.FC<SoundIconProps> = ({
  name,
  soundType,
  size = 20,
  color = '#55C2E8',
}) => {
  const identifier = (name || soundType || '').toLowerCase().replace(/[-_]/g, '');

  switch (identifier) {
    case 'bell':
    case 'doorbell':
      return <Bell size={size} color={color} />;
    case 'doorclosed':
    case 'doorknock':
    case 'knock':
      return <DoorClosed size={size} color={color} />;
    case 'volume2':
    case 'speech':
    case 'namecalled':
    case 'personspeaking':
    case 'voice':
      return <Volume2 size={size} color={color} />;
    case 'microwave':
    case 'appliance':
    case 'appliancebeep':
      return <Microwave size={size} color={color} />;
    case 'car':
    case 'carhorn':
    case 'carapproaching':
    case 'vehicle':
      return <Car size={size} color={color} />;
    case 'phone':
    case 'phoneringing':
      return <Phone size={size} color={color} />;
    case 'droplets':
    case 'runningwater':
      return <Droplets size={size} color={color} />;
    case 'wind':
    case 'vacuum':
      return <Wind size={size} color={color} />;
    case 'music2':
    case 'singing':
      return <Music2 size={size} color={color} />;
    case 'footprints':
    case 'footsteps':
      return <Footprints size={size} color={color} />;
    case 'hand':
    case 'clapping':
      return <Hand size={size} color={color} />;
    case 'audiolines':
    case 'whistling':
      return <AudioLines size={size} color={color} />;
    case 'dog':
      return <Dog size={size} color={color} />;
    case 'glasswater':
    case 'glassbreaking':
      return <GlassWater size={size} color={color} />;
    case 'carfront':
      return <CarFront size={size} color={color} />;
    case 'flame':
    case 'fire':
    case 'smoke':
    case 'alarm':
    case 'firealarm':
      return <Flame size={size} color={color} />;
    case 'baby':
    case 'babycrying':
      return <Baby size={size} color={color} />;
    case 'siren':
    case 'emergencysiren':
    case 'emergency':
      return <Siren size={size} color={color} />;
    case 'shieldalert':
    case 'dogbark':
    case 'bark':
      return <ShieldAlert size={size} color={color} />;
    case 'coffee':
    case 'kettle':
      return <Coffee size={size} color={color} />;
    case 'radio':
      return <Radio size={size} color={color} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} />;
    case 'zap':
      return <Zap size={size} color={color} />;
    default:
      return <AlertCircle size={size} color={color} />;
  }
};
