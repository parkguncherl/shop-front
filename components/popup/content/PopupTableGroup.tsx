import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const PopupTableGroup = (props: Props) => {
  return (
    <div className={'tbl_group'}>
      <div className={'tbl_box'}>{props.children}</div>
    </div>
  );
};
