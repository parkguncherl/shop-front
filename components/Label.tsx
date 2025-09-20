import React from 'react';

interface Props {
  title: string;
  value?: string;
  style?: React.CSSProperties;
}

export const Label = (props: Props) => {
  return (
    <dl>
      <dt>
        <label>{props.title}</label>
      </dt>
      <dd style={props.style}>{props.value}</dd>
    </dl>
  );
};
