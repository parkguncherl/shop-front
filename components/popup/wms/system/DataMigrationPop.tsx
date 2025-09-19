import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { useEffect } from 'react';

interface Props {
  message?: string;
  state: boolean;
  setState: (value: boolean) => void;
}

const DataMigrationPop = ({ message, state, setState }: Props) => {
  return (
    <PopupLayout
      width={880}
      isEscClose={true}
      open={state}
      title={'오류내용'}
      onClose={() => {
        setState(false);
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                setState(false);
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="mt10" style={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default DataMigrationPop;
