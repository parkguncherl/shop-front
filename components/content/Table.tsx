import React from 'react';
import { HomeResponseDetail } from '../../generated';

interface Props {
  children: React.ReactNode;
  rowData?: [HomeResponseDetail];
}

export const Table = (props: Props) => {
  return <div className="gridBox">{props.children}</div>;
};
