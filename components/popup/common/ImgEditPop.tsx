import React, { useRef, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import CanvasByKonva, { CanvasByKonvaRef } from '@/components/drawing/CanvasByKonva';
import useFilters from '@/hooks/useFilters';
import { CustomColorPicker } from '@/components/CustomColorPicker';
import { toastError } from '@/components/ToastMessage';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Search } from '@/components/content';

// import icoUndo from '@/public/images/ico_undo.svg';
// import icoRedo from '@/public/images/ico_redo.svg';

export interface ImgPropsOnEditPop {
  imgFileId?: number;
  imgFileName?: string;
  imgSrc?: string;
  seq?: number;
}
interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  imgProps?: ImgPropsOnEditPop;
  onFileIsExportedByConf: (file: File) => void;
}

/** konva 기반 컴포넌트를 통한 이미지 편집 팝업, 이미지 인자가 제공되지 아니하는 경우 free form */
const ImgEditPop = ({ open, onClose, imgProps, onFileIsExportedByConf }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);
  const canvasByKonvaRef = useRef<CanvasByKonvaRef>(null);
  const topSearchWrapperRef = useRef<HTMLDivElement>(null);

  const [preview, setPreview] = useState(false);
  const [colorPickerOpened, setColorPickerOpened] = useState(false);
  const [updateConfOpened, setUpdateConfOpened] = useState(false);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    textColor: '#000000',
    textScale: undefined,
    textWeight: undefined, // '100' | '200' | '300' | '400' | '500' | '600' | '700'
    lineColor: '#FF4A00',
    lineWidth: undefined,
  });

  const onCloseCommon = () => {
    if (onClose) onClose();
    onFiltersReset();
    setPreview(false);
    setColorPickerOpened(false);
    setUpdateConfOpened(false);
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={930}
        open={open}
        isEscClose={true}
        title={'이미지 수정'}
        onClose={onCloseCommon}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_primary"
                  onClick={() => {
                    canvasByKonvaRef.current?.customs.api.addNewText();
                  }}
                >
                  새로운 글 추가
                </button>

                <button
                  className="btn btn_primary"
                  onClick={() => {
                    canvasByKonvaRef.current?.customs.api.addNewDimensionLine();
                  }}
                >
                  새로운 치수선 추가
                </button>

                <button
                  className={'btn ' + (!preview ? 'btn_primary' : '')}
                  onClick={() => {
                    setPreview(!preview);
                  }}
                >
                  {!preview ? '미리보기' : '편집'}
                </button>
                <button
                  className="btn btn_primary"
                  disabled={!preview}
                  onClick={() => {
                    canvasByKonvaRef.current!.customs.api.exportAsFile().then((file: File | null) => {
                      if (file == null) {
                        toastError('어떠한 수정사항도 없이 저장할 수 없습니다');
                        return;
                      }
                      setUpdateConfOpened(true);
                    });
                  }}
                >
                  저장
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={onCloseCommon}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="searchBox" ref={topSearchWrapperRef}>
            <div className="searchArea">
              <div className={'type_2'}>
                <CustomColorPicker
                  title={'텍스트 색상'}
                  name={'textColor'}
                  color={filters.textColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  wrapperRef={topSearchWrapperRef}
                  onColorPickerOpened={() => setColorPickerOpened(true)}
                  onColorPickerClosed={() => setColorPickerOpened(false)}
                />
                <CustomColorPicker
                  title={'줄(라인) 색상'}
                  name={'lineColor'}
                  color={filters.lineColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  colorPickerCoordinates={{
                    left: 360,
                  }}
                  wrapperRef={topSearchWrapperRef}
                />
                <Search.DropDown
                  title={'줄 너비'}
                  name={'lineWidth'}
                  codeUpper={'10040'}
                  value={filters.lineWidth}
                  onChange={(name, value) => {
                    onChangeFilters(name, Number(value));
                  }}
                />
                <Search.DropDown
                  title={'텍스트 크기'}
                  name={'textScale'}
                  codeUpper={'10050'}
                  value={filters.textScale}
                  onChange={(name, value) => {
                    onChangeFilters(name, Number(value));
                  }}
                />
                <Search.DropDown
                  title={'텍스트 두께'}
                  name={'textWeight'}
                  defaultOptions={[
                    {
                      key: '100',
                      value: '100',
                      label: 'thin',
                    },
                    {
                      key: '200',
                      value: '200',
                      label: 'extra light',
                    },
                    {
                      key: '300',
                      value: '300',
                      label: 'light',
                    },
                    {
                      key: '400',
                      value: '400',
                      label: 'normal',
                    },
                    {
                      key: '500',
                      value: '500',
                      label: 'medium',
                    },
                    {
                      key: '600',
                      value: '600',
                      label: 'semi bold',
                    },
                    {
                      key: '700',
                      value: '700',
                      label: 'bold',
                    },
                  ]}
                  value={filters.textWeight}
                  onChange={(name, value) => {
                    onChangeFilters(name, Number(value));
                  }}
                />
                <dl>
                  <dt>
                    <label>{'뒤로(혹은 앞으로)가기'}</label>
                  </dt>
                  <dd>
                    <div className={`formBox`}>
                      <div style={{ padding: '3px' }}>
                        {/*<img*/}
                        {/*  src={icoUndo.src}*/}
                        {/*  style={{ width: '15px', height: '15px' }}*/}
                        {/*  onClick={() => {*/}
                        {/*    canvasByKonvaRef.current!.customs.api.undo();*/}
                        {/*  }}*/}
                        {/*/>*/}
                        <button
                          className="btn btn_primary"
                          onClick={() => {
                            canvasByKonvaRef.current!.customs.api.undo();
                          }}
                        >
                          뒤로
                        </button>
                      </div>
                      <div style={{ padding: '3px' }}>
                        {/*<img*/}
                        {/*  src={icoRedo.src}*/}
                        {/*  style={{ width: '15px', height: '15px' }}*/}
                        {/*  onClick={() => {*/}
                        {/*    canvasByKonvaRef.current!.customs.api.redo();*/}
                        {/*  }}*/}
                        {/*/>*/}
                        <button
                          className="btn btn_primary"
                          onClick={() => {
                            canvasByKonvaRef.current!.customs.api.redo();
                          }}
                        >
                          앞으로
                        </button>
                      </div>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={'imgEditPop'} ref={topWrapperRef}>
            <CanvasByKonva
              wrapperRef={topWrapperRef}
              img={imgProps}
              ref={canvasByKonvaRef}
              preview={preview}
              textConfig={{
                color: filters.textColor,
                scale: filters.textScale,
                weight: filters.textWeight,
              }}
              lineConfig={{
                color: filters.lineColor,
                width: filters.lineWidth,
              }}
              preventDrawing={colorPickerOpened}
            />
          </div>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={updateConfOpened}
        onClose={() => setUpdateConfOpened(false)}
        onConfirm={() => {
          canvasByKonvaRef.current!.customs.api.exportAsFile().then((file: File | null) => {
            if (file == null) {
              // 기본 fallback
              console.error('파일을 저장할 수 없음');
              return;
            }
            onFileIsExportedByConf(file);
          });
        }}
        title={
          imgProps == undefined || imgProps.imgSrc == undefined
            ? '화이트보드에 작성된 현 상태를 이미지로서 저장하시겠습니까?'
            : '수정된 이미지로 기존 이미지를 대체하시겠습니까?'
        }
      />
    </div>
  );
};

export default ImgEditPop;
