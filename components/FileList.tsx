import { useAgGridApi } from '../hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../libs';
import { toastError, toastSuccess } from './ToastMessage';
import React, { useState } from 'react';
import { FileDet } from '../generated';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../libs/ag-grid';
import { Button } from './Button';
import { useCommonStore } from '../stores';
import { AgGridReact } from 'ag-grid-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  fileId: number | string;
  headerBoolean?: boolean;
  style?: React.CSSProperties;
  addFunction?: () => void;
}

export const FileList = ({ fileId, headerBoolean = true, style = { height: '150px' }, addFunction }: Props) => {
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  /** 공통 스토어 - API */
  const [fileDownload, deleteFile] = useCommonStore((s) => [s.fileDownload, s.deleteFile]);
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState(false);

  /** 파일 목록 조회 */
  const {
    data: files,
    isLoading: filesIsLoading,
    refetch: filesRefetch,
  } = useQuery([`/common/file/${fileId}`], () => authApi.get(`/common/file/${fileId}`), {
    enabled: !!fileId,
    refetchOnMount: 'always',
    onSuccess: (e) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        setSelectFileList(body);
      } else {
        toastError(resultMessage);
      }
    },
  });

  const [selectFileList, setSelectFileList] = useState<FileDet[]>(files?.data?.body || []);

  /** 파일 필드별 설정 */
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'fileNm',
      headerName: '파일명',
      minWidth: 150,
      cellRenderer: ({ data }: any) => {
        return (
          <span style={{ textDecoration: 'underline', color: 'blue' }} onClick={() => fileDownload(data)}>
            {data.fileNm}
          </span>
        );
      },
    },
    {
      field: 'fileSize',
      headerName: '파일 사이즈',
      maxWidth: 100,
      valueFormatter: (params) => {
        return params.value && (params.value / 1024 / 1024).toFixed(2) + ' MB';
      },
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    { field: 'createUserNm', headerName: '등록자', maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'createDateTime', headerName: '등록일시', maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'deleteFn',
      headerName: '삭제',
      cellRenderer: ({ data }: any) => {
        return (
          <button className={'tblBtn'} onClick={() => setConfirmModal(true)}>
            {'삭제'}
          </button>
        );
      },
      minWidth: 80,
      width: 80,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);

  /** 파일 삭제 */
  const { mutate: deleteFileMutate, isLoading: deleteFileIsLoading } = useMutation(deleteFile, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries([`/common/file/${fileId}`]);
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const deleteFileFn = () => {
    const selectedRows = gridApi?.getSelectedRows();

    if (selectedRows?.length) {
      deleteFileMutate({ id: selectedRows[0].id, fileSeq: selectedRows[0].fileSeq });
    }

    if (addFunction) {
      addFunction();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className={'ag-theme-alpine'} style={style}>
        <AgGridReact
          onGridReady={(e) => {
            e.api.sizeColumnsToFit();
            onGridReady(e);
          }}
          headerHeight={!headerBoolean ? 0 : undefined}
          rowData={selectFileList || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={'single'}
          rowHeight={24}
          tooltipShowDelay={0}
          overlayNoRowsTemplate={'<span></span>'}
        />
      </div>
      <ConfirmModal title={'파일을 삭제하시겠습니까?'} open={confirmModal} onConfirm={deleteFileFn} onClose={() => setConfirmModal(false)} />
    </div>
  );
};
