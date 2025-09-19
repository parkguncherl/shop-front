import React from 'react';

type Folder = {
  name: string;
  subfolders?: Folder[];
};

const folderStructure: Folder[] = [
  {
    name: 'src',
    subfolders: [
      { name: '컴포넌트', subfolders: [] },
      { name: '페이지', subfolders: [] },
      {
        name: '유틸리티',
        subfolders: [
          { name: '헬퍼', subfolders: [] },
          { name: '타입', subfolders: [] },
        ],
      },
    ],
  },
  { name: '공개', subfolders: [] },
  { name: '스타일', subfolders: [] },
  { name: '노드 모듈', subfolders: [] },
];

const renderFolder = (folder: Folder): JSX.Element => {
  return (
    <div style={{ marginLeft: '20px' }}>
      <strong>{folder.name}</strong>
      {folder.subfolders && folder.subfolders.length > 0 && (
        <div>
          {folder.subfolders.map((subfolder) => (
            <div key={subfolder.name}>{renderFolder(subfolder)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const FolderStructure = () => {
  return (
    <div>
      <h1>폴더 구조</h1>
      {folderStructure.map((folder) => (
        <div key={folder.name}>{renderFolder(folder)}</div>
      ))}
    </div>
  );
};

export default FolderStructure;
