import { CodeRequestCreate, CodeResponseLowerSelect, CodeResponsePaging } from '../../../../generated';
import { useCodeStore } from '../../../../stores';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType, PopupTableGroup } from '../../content';
import { Label } from '../../../Label';
import { TableHeader } from '../../../TableHeader';
import { PopupFooter } from '../../PopupFooter';
import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import ModalLayout from '../../../ModalLayout';
import { useAgGridApi } from '../../../../hooks';
import Loading from '../../../Loading';
import { AgGridReact } from 'ag-grid-react';
import { Table } from '../../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { PopupLayout } from '../../PopupLayout';

interface Props {
  data: CodeResponsePaging;
}

/** 시스템 - 코드관리 - 하위코드 팝업 */
export const CodeMngDetailPop = ({ data }: Props) => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 코드관리 스토어 - State */
  const [codeUpper, setCodeUpper, modalType, closeModal] = useCodeStore((s) => [s.codeUpper, s.setCodeUpper, s.modalType, s.closeModal]);

  /** 코드관리 스토어 - API */
  const [selectLowerCodeByCodeUpper, insertCodes] = useCodeStore((s) => [s.selectLowerCodeByCodeUpper, s.insertCodes]);

  const queryClient = useQueryClient();

  const [lastRowIndex, setLastRowIndex] = useState<number | null>();

  /** 하위코드 필드별 설정 */
  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 60, maxWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'codeCd', headerName: '코드*', minWidth: 80, editable: false, suppressHeaderMenuButton: true },
    { field: 'codeNm', headerName: '이름*', minWidth: 120, editable: false, suppressHeaderMenuButton: true },
    { field: 'codeEngNm', headerName: '영문명 ', minWidth: 80, editable: false, suppressHeaderMenuButton: true },
    { field: 'codeDesc', headerName: '설명 ', minWidth: 120, editable: false, suppressHeaderMenuButton: true },
    { field: 'codeEtcInfo', headerName: '기타정보1 ', minWidth: 80, editable: false, suppressHeaderMenuButton: true },
    { field: 'codeEtcEngInfo', headerName: '기타정보2 ', minWidth: 80, editable: false, suppressHeaderMenuButton: true },
  ]);

  /** 하위코드 목록 조회 */
  const { data: lowerCodes, isLoading } = useQuery(['/code/lower/', codeUpper], selectLowerCodeByCodeUpper, {
    refetchOnMount: 'always',
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode !== 200) {
        toastError(resultMessage);
      }
    },
  });

  /** 하위코드 저장(수정/등록) */
  const { mutate: insertCodesMutate, isLoading: insertCodesIsLoading } = useMutation(insertCodes, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다. ');
          await queryClient.invalidateQueries(['/code/paging']);
          await queryClient.invalidateQueries(['/code/dropdown/TOP']);
          await queryClient.invalidateQueries(['/code/lower/', codeUpper]);
          if (data.codeCd === '10280') {
            await queryClient.invalidateQueries(['/code/dropdown/10280']);
          }
          closeModal('LOWER');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 하위코드, 행 추가 버튼 클릭 시 */
  const addRow = () => {
    gridApi?.stopEditing();

    if (lastRowIndex != null) {
      gridApi?.applyTransaction({ add: [{}], addIndex: lastRowIndex + 1 });
    } else {
      gridApi?.applyTransaction({ add: [{}] });
    }
  };

  /** 하위코드, 행 삭제 버튼 클릭 시 */
  const removeRow = () => {
    const selectedNodes = gridApi?.getSelectedNodes();
    const selectedData = selectedNodes?.map((node) => node.data);
    if (!selectedData?.length) {
      toastError('선택된 행이 없습니다. ');
      return;
    }

    for (let i = 0; i < selectedData.length; i++) {
      gridApi?.applyTransaction({ remove: [selectedData[i]] });
    }
  };

  /** 하위코드, 저장 버튼 클릭 시 */
  const updateCodesFn = async () => {
    gridApi?.stopEditing();

    const gridData: any[] = [];

    gridApi?.forEachNode(function (node) {
      gridData.push(node.data);
    });

    for (let i = 0; i < gridData.length; i++) {
      if (!gridData[i].codeCd) {
        toastError('코드를 입력해주세요. ');
        return;
      } else if (!gridData[i].codeNm) {
        toastError('이름을 입력해주세요. ');
        return;
      } else if (!gridData[i].id) {
        gridData[i].codeUpper = data.codeCd;
      }

      if (gridData[i].codeCd.length > 20) {
        toastError('[코드] 20자 이내로 입력하세요. ');
        return;
      } else if (gridData[i].codeNm.length > 300) {
        toastError('[이름] 300자 이내로 입력하세요. ');
        return;
      } else if (gridData[i].codeEngNm && gridData[i].codeEngNm.length > 300) {
        toastError('[영문명] 300자 이내로 입력하세요. ');
        return;
      } else if (gridData[i].codeDesc && gridData[i].codeDesc.length > 300) {
        toastError('[설명] 300자 이내로 입력하세요. ');
        return;
      } else if (gridData[i].codeEtcInfo && gridData[i].codeEtcInfo.length > 300) {
        toastError('[기타정보1] 300자 이내로 입력하세요. ');
        return;
      } else if (gridData[i].codeEtcEngInfo && gridData[i].codeEtcEngInfo.length > 300) {
        toastError('[기타정보2] 300자 이내로 입력하세요. ');
        return;
      }
    }

    if (data.codeCd == 'S0001') {
      const uniqueData = new Set(
        gridData.filter((v) => v.codeEtcInfo != '' && v.codeEtcInfo != undefined).map((s) => JSON.stringify({ codeEtcInfo: s.codeEtcInfo })),
      );
      const existData = gridData.filter((v) => v.codeEtcInfo != '' && v.codeEtcInfo != undefined);

      if (uniqueData.size < existData.length) {
        toastError('기타정보가(Azure DPS) 중복됩니다. 변경해주세요. ');
        return;
      }
    }

    const uniqueData = new Set(gridData.map((s) => JSON.stringify({ codeCd: s.codeCd })));
    const uniqueData2 = new Set(gridData.map((s) => JSON.stringify({ codeNm: s.codeNm })));

    if (uniqueData.size < gridData.length) {
      toastError('코드는 중복될 수 없습니다. ');
      return;
    }

    if (uniqueData2.size < gridData.length) {
      toastError('이름은 중복될 수 없습니다. ');
      return;
    }

    insertCodesMutate(gridData as unknown as CodeRequestCreate[]);
  };

  /** 페이지 열 때 초기화 */
  useEffect(() => {
    setCodeUpper(data.codeCd || '');
  }, []);

  return (
    <PopupLayout
      width={800}
      isEscClose={false}
      open={modalType.type === 'LOWER' && modalType.active}
      title={'하위코드 보기'}
      onClose={() => closeModal('LOWER')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={() => closeModal('LOWER')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <Label title={'코드 '} value={data.codeCd} />
            <Label title={'이름 '} value={data.codeNm} />
          </PopupSearchType>
        </PopupSearchBox>
        <div className={'mt10'}>
          <Table>
            <TableHeader count={lowerCodes?.data?.body?.length || 0}></TableHeader>
            <div className={'ag-theme-alpine wmsPop'}>
              <AgGridReact
                onGridReady={onGridReady}
                rowData={(lowerCodes?.data?.body as CodeResponseLowerSelect[]) || []}
                gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                columnDefs={columnDefs}
                defaultColDef={{
                  ...defaultColDef,
                  singleClickEdit: true,
                }}
                rowSelection={'multiple'}
                rowDragManaged={true}
                rowDragMultiRow={true}
                rowDragEntireRow={true}
                rowMultiSelectWithClick={true}
                onRowClicked={(e) => setLastRowIndex(e.rowIndex)}
                loading={isLoading}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
              />
            </div>
          </Table>
        </div>
      </PopupContent>
      {isLoading && <Loading />}
    </PopupLayout>
  );
};
