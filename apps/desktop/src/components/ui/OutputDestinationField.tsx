import { Folder } from 'lucide-react';
import { Button } from './Button';

type OutputDestinationFieldProps = {
  destinationLabel: string;
  destinationPath?: string;
  onChooseDestination: () => void;
};

export function OutputDestinationField({
  destinationLabel,
  destinationPath,
  onChooseDestination,
}: OutputDestinationFieldProps) {
  return (
    <div className="output-location-row">
      <p className="output-location-label">Location</p>
      <div className="output-destination-wrap">
        <p className="output-destination" title={destinationPath ?? destinationLabel}>
          <Folder aria-hidden="true" />
          <span>{destinationLabel}</span>
        </p>
        <Button variant="ghost" className="output-change-btn" onClick={onChooseDestination}>
          Change
        </Button>
      </div>
    </div>
  );
}
