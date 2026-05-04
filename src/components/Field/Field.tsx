import React, { forwardRef, useId, isValidElement, cloneElement } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import styles from './Field.module.css';

export interface FieldProps {
  label: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, children, id, className }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    let content = children;
    if (isValidElement(children)) {
      const childProps = children.props as { id?: string };
      if (childProps.id === undefined) {
        content = cloneElement(children as React.ReactElement<{ id?: string }>, { id: fieldId });
      }
    }

    return (
      <div ref={ref} className={cn(styles.field, className)}>
        <Text variant="text-body-small-emphasis" as="label" htmlFor={fieldId}>{label}</Text>
        {content}
      </div>
    );
  }
);

Field.displayName = 'Field';
