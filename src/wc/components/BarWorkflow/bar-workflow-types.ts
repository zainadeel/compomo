export interface BarWorkflowStep {
  id: string;
  label: string;
  isInactive?: boolean;
}

export interface BarWorkflowSubmitAction {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  isInactive?: boolean;
  isLoading?: boolean;
}
