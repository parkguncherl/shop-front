import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Layer, Stage, Image, Line, Text, Transformer, Arrow } from 'react-konva';
import Konva from 'konva';
import { Html, useImage } from 'react-konva-utils';
import { Box } from 'konva/lib/shapes/Transformer';
import { useHistory } from '@/hooks/drawing/useHistory';
import axios from 'axios';
import { authApi } from '@/libs';
import path from 'path';
import icoUndo from '@/public/images/ico_undo.svg';
import icoRedo from '@/public/images/ico_redo.svg';

// CanvasByKonva props interface 및 연관 interface
interface CanvasByKonvaProps {
  img?: ImgOnCanvasByKonva;
  wrapperRef: React.RefObject<HTMLDivElement>; // wrapper 태그의 너비, 높이를 통하여 캔버스 비율이 결정되므로 반드시 전달되어야 함

  ref?: React.Ref<CanvasByKonvaRef>;
  tool?: 'pen' | 'eraser';
  preview?: boolean; // 미리보기
  textConfig?: {
    color?: string;
    scale?: number;
  };
  lineConfig?: Omit<Lines, 'tool' | 'points'>;
  preventDrawing?: boolean; // 드로잉 비활성화 여부
  enableEmbeddedUndoRedoBtn?: boolean;
}
export interface ImgOnCanvasByKonva {
  imgFileName?: string; // 참조 콜백에서 반환할 파일명을 위하여 필요
  imgSrc?: string;
}
export type CanvasByKonvaRef = Konva.Stage & CanvasByKonvaCustomsRef;
type CanvasByKonvaCustomsRef = {
  customs: {
    api: {
      addNewText: (value?: string) => void;
      addNewDimensionLine: () => void;
      exportAsFile: (fileName?: string) => Promise<File | null>;
      undo: () => void;
      redo: () => void;
    };
  };
};
interface TransformEventOnImg extends Omit<ImageRepInfo, 'src'> {}
interface TransformEventOnText extends Omit<TextInfo, 'content' | 'color'> {}
interface ChangeEventOnText {
  width?: number; // 존재할 시 너비, 높이 조정
  height?: number; // 존재할 시 너비, 높이 조정
  content?: string; // 존재할 시 값 수정
}
interface TransformEventOnDimensionLine extends Omit<DimensionLine, 'color'> {}

// 하위 컴포넌트 props interface
interface MainImageProps {
  imgRepInfo: ImageRepInfo;
}
interface EditableTextProps {
  textInfo: TextInfo;
  onMouseDown?: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd?: (evt: Konva.KonvaEventObject<DragEvent>) => void;
  onEditEnd?: () => void;
  onChangeByEditor?: (evt: ChangeEventOnText) => void;
  enablePreviewMode?: boolean; // 미리보기 활성 switching state
  onTransformed?: (evt: TransformEventOnText) => void;
}
interface TextEditorProps {
  textRef: React.RefObject<any>;
  onClose?: () => void;
  onChange?: (evt: ChangeEventOnText) => void;
  content: string;
}
interface TransformableImageProps {
  imgRepInfo: ImageRepInfo;
  onMouseDown?: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd?: (evt: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformed?: (evt: TransformEventOnImg) => void;
  enablePreviewMode?: boolean; // 미리보기 활성 switching state
}
interface DimensionLineProps {
  enablePreviewMode?: boolean; // 미리보기 활성 switching state
  dimensionLine: DimensionLine;
  onTransformed?: (evt: TransformEventOnDimensionLine) => void;
  onDragEnd?: (evt: Konva.KonvaEventObject<DragEvent>) => void;
}

// state's types
interface locProps {
  width: number;
  height: number;
  x: number;
  y: number;
  scaleX: number; // 확대 축소(x축)
  scaleY: number; // 확대 축소(y축)
  rotation: number; // 회전 핸들 대응
}
interface ImageRepInfo extends locProps {
  src: string;
}
interface TextInfo extends locProps {
  content: string;
  color?: string;
}
interface Lines {
  tool: string;
  points: number[];
  color?: string;
  width?: number;
}
interface DimensionLine extends Omit<locProps, 'width' | 'height'> {
  points: number[];
  color?: string;
}

// 스냅샷용 인터페이스
export interface CanvasSnapshot {
  lines: Lines[];
  texts: TextInfo[];
  imgs: ImageRepInfo[];
  dimensionLines: DimensionLine[];
}

/** 주 이미지 영역 */
const MainImage = ({ imgRepInfo }: MainImageProps) => {
  const [image] = useImage(imgRepInfo.src); // 항상 유효한 HTMLImageElement 보장
  return <Image image={image} x={imgRepInfo.x} y={imgRepInfo.y} width={imgRepInfo?.width} height={imgRepInfo?.height} />;
};

/** 입력 영역 */
const TextArea = ({ textRef, onClose, onChange, content }: TextEditorProps) => {
  const [inputValue, setInputValue] = useState('');

  const enterKeyPressed = useRef(false);

  useEffect(() => {
    setInputValue(content); // 동기화
  }, [content]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    if (!textRef.current) return;

    const textarea = textareaRef.current;
    const textPosition = textRef.current.position();
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Match styles with the text node
    textarea.value = textRef.current.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textRef.current.width() - textRef.current.padding() * 2}px`;
    textarea.style.height = `${textRef.current.height() - textRef.current.padding() * 2 + 5}px`;
    textarea.style.fontSize = `${textRef.current.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textRef.current.lineHeight();
    textarea.style.fontFamily = textRef.current.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textRef.current.align();
    textarea.style.color = textRef.current.fill();

    const rotation = textRef.current.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();
  }, []);

  // Add event listeners
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enterKeyPressed.current = true;

      if (onChange && textareaRef.current) {
        onChange({
          content: inputValue,
        });
      }
      if (onClose) onClose();
    }
    if (e.key === 'Escape') {
      if (onClose) onClose();
    }
  };

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const eventTarget = event.target as HTMLTextAreaElement;
    if (textareaRef.current) {
      const lines = eventTarget.value.split(/\r?\n/); // 줄바꿈 여부에 따라 나눔
      const maxLength = Math.max(...lines.map((line) => line.length));
      textareaRef.current.style.width = `${maxLength * 20}px`;
      textareaRef.current.style.height = `${lines.length * 20}px`;

      if (onChange) {
        onChange({
          width: maxLength * 20,
          height: lines.length * 20,
        });
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      style={{
        minHeight: '1em',
        position: 'absolute',
      }}
      onBlur={() => {
        if (enterKeyPressed.current) {
          enterKeyPressed.current = false; // 결과로 인해 발생한 blur 동작이므로 해당 시점에 플래그 해제
          return;
        }
        if (onChange) {
          onChange({
            content: inputValue,
          });
        }
        if (onClose) onClose();
      }}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
    />
  );
};

const TextEditor = (props: TextEditorProps) => {
  // Konva stage 내에 DOM element를 랜더링하기 위해 react-konva-utils 의 Html 을 사용한다.
  return (
    <Html>
      <TextArea {...props} />
    </Html>
  );
};

/** text 에디팅 동작을 위한 필요 영역이 정의된 고수준 영역 */
const EditableText = ({ textInfo, onMouseDown, onDragEnd, onEditEnd, onChangeByEditor, enablePreviewMode, onTransformed }: EditableTextProps) => {
  const [onEditing, setOnEditing] = useState(false);

  const textRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    // transformer 활성화를 위하여 랜더링 시점에 text 참조와 연결
    if (!enablePreviewMode && !onEditing) {
      if (trRef.current && textRef.current) {
        (trRef.current as any).nodes([textRef.current]);
      }
    }
  }, [enablePreviewMode, onEditing]);

  return (
    <>
      <Text
        name={'text-with-tr'}
        text={textInfo.content}
        x={textInfo.x}
        y={textInfo.y}
        width={textInfo?.width}
        height={textInfo?.height}
        scaleX={textInfo?.scaleX}
        scaleY={textInfo?.scaleY}
        rotation={textInfo?.rotation}
        draggable={!enablePreviewMode}
        onMouseDown={onMouseDown}
        onDragEnd={onDragEnd}
        visible={!onEditing}
        onDblClick={() => {
          if (!enablePreviewMode) {
            setOnEditing(true);
          }
        }}
        ref={textRef}
        onTransformEnd={() => {
          const node = textRef.current as any;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();

          if (onTransformed) {
            onTransformed({
              x: node.x(),
              y: node.y(),
              width: node.width(),
              height: node.height(),
              scaleX: scaleX as number,
              scaleY: scaleY as number,
              rotation: rotation as number,
            });
          }
        }}
        fontSize={20}
        fill={textInfo.color}
      />
      {onEditing && (
        <TextEditor
          content={textInfo.content}
          textRef={textRef}
          onChange={(evt) => {
            if (onChangeByEditor) onChangeByEditor(evt);
          }}
          onClose={() => {
            setOnEditing(false);
            if (onEditEnd) onEditEnd();
          }}
        />
      )}
      {!enablePreviewMode && !onEditing && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(_: Box, newBox: Box) => {
            return {
              ...newBox,
              width: Math.max(30, (newBox as any).width),
            };
          }}
        />
      )}
    </>
  );
};

const TransformableImage = ({
  imgRepInfo,
  onMouseDown,
  onDragEnd,
  onTransformed,
  enablePreviewMode, // 미리보기 활성 switching state
}: TransformableImageProps) => {
  const [image] = useImage(imgRepInfo.src); // 항상 유효한 HTMLImageElement 보장

  const imageRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (!enablePreviewMode) {
      // transformer 활성화를 위하여 랜더링 시점에 image 참조와 연결
      if (trRef.current && imageRef.current) {
        (trRef.current as any).nodes([imageRef.current]);
      }
    }
  }, [enablePreviewMode]);

  return (
    <>
      <Image
        image={image}
        name={'img-with-tr'}
        x={imgRepInfo.x}
        y={imgRepInfo.y}
        width={imgRepInfo?.width}
        height={imgRepInfo?.height}
        scaleX={imgRepInfo?.scaleX}
        scaleY={imgRepInfo?.scaleY}
        rotation={imgRepInfo?.rotation}
        onMouseDown={onMouseDown}
        onDragEnd={onDragEnd}
        ref={imageRef}
        draggable={!enablePreviewMode}
        onTransformEnd={() => {
          const node = imageRef.current as any;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();

          if (onTransformed) {
            onTransformed({
              x: node.x(),
              y: node.y(),
              width: node.width(),
              height: node.height(),
              scaleX: scaleX as number,
              scaleY: scaleY as number,
              rotation: rotation as number,
            });
          }
        }}
      />
      {!enablePreviewMode && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox: Box, newBox: Box) => {
            // 리사이징 제한
            if (Math.abs((newBox as any).width) < 5 || Math.abs((newBox as any).height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const DimensionLine = ({ enablePreviewMode, dimensionLine, onTransformed, onDragEnd }: DimensionLineProps) => {
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (!enablePreviewMode) {
      // transformer 활성화를 위하여 랜더링 시점에 image 참조와 연결
      if (trRef.current && shapeRef.current) {
        (trRef.current as any).nodes([shapeRef.current]);
      }
    }
  }, [enablePreviewMode]);

  const handleTransformEnd = () => {
    const node = shapeRef.current as any;

    const rotation = node.rotation();

    // 현재 노드의 실제 좌표와 스케일 값을 가져옴
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 2. 새로운 points 좌표 계산
    // 기존 points에 scale을 곱해서 실제 픽셀 길이를 구함
    const oldPoints = node.points();
    const newPoints = [oldPoints[0] * scaleX, oldPoints[1] * scaleY, oldPoints[2] * scaleX, oldPoints[3] * scaleY];

    // 3. 노드의 scale을 다시 1로 리셋 (화살촉 왜곡 방지)
    node.scaleX(1);
    node.scaleY(1);

    // 4. 상태 업데이트 (이 값이 DB 등에 저장될 최종 좌표)
    if (onTransformed) {
      onTransformed({
        x: node.x(),
        y: node.y(),
        scaleX: 1, // 리셋 이후
        scaleY: 1, // 리셋 이후
        points: newPoints,
        rotation: rotation as number,
      });
    }
  };

  return (
    <>
      <Arrow
        ref={shapeRef}
        name={'arrow-with-tr'}
        points={dimensionLine.points}
        rotation={dimensionLine.rotation}
        scaleX={dimensionLine.scaleX}
        scaleY={dimensionLine.scaleY}
        x={dimensionLine.x}
        y={dimensionLine.y}
        stroke={dimensionLine.color}
        onDragEnd={onDragEnd}
        strokeWidth={2}
        hitStrokeWidth={20}
        fill={dimensionLine.color}
        pointerAtBeginning={true}
        draggable={!enablePreviewMode}
        onTransformEnd={handleTransformEnd}
      />

      {!enablePreviewMode && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          enabledAnchors={['middle-left', 'middle-right']} // anchor 명시적 지정
          anchorSize={12}
          boundBoxFunc={(oldBox: Box, newBox: Box) => {
            // 리사이징 제한
            if (Math.abs((newBox as any).width) < 5 || Math.abs((newBox as any).height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

/**
 * konva를 통한 주어진 이미지 에디팅을 가능하게 하는 StateFul 컴포넌트
 *
 * */
const CanvasByKonva = ({
  img,
  wrapperRef,
  ref,
  tool = 'pen',
  preview,
  textConfig,
  lineConfig,
  preventDrawing,
  enableEmbeddedUndoRedoBtn,
}: CanvasByKonvaProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [mainImgRepInfo, setMainImgRepInfo] = useState<ImageRepInfo | undefined>(undefined);

  const [textInfoList, setTextInfoList] = useState<TextInfo[]>([]);
  const [imgRepInfoList, setImgRepInfoList] = useState<ImageRepInfo[]>([]);
  const [lines, setLines] = useState<Lines[]>([]);
  const [dimensionLineList, setDimensionLineList] = useState<DimensionLine[]>([]); // [100, 100, 300, 100]

  const isDrawing = useRef(false);
  const stageRef = useRef<Konva.Stage>(null);

  const { pushHistory, undo, redo, getState } = useHistory<CanvasSnapshot>({
    lines: lines,
    texts: textInfoList,
    imgs: imgRepInfoList,
    dimensionLines: dimensionLineList,
  });

  const [undoImg] = useImage(icoUndo.src);
  const [redoImg] = useImage(icoRedo.src);

  const commitTextInfo = (textInfos: TextInfo[]) => {
    pushHistory({
      texts: textInfos,
      lines: lines,
      imgs: imgRepInfoList,
      dimensionLines: dimensionLineList,
    });
    setTextInfoList(textInfos);
  };
  const commitLines = (linesInfo: Lines[]) => {
    pushHistory({
      texts: textInfoList,
      lines: linesInfo,
      imgs: imgRepInfoList,
      dimensionLines: dimensionLineList,
    });
    setLines(linesInfo);
  };

  const commitImages = (ImageRepInfo: ImageRepInfo[]) => {
    pushHistory({
      texts: textInfoList,
      lines: lines,
      imgs: ImageRepInfo,
      dimensionLines: dimensionLineList,
    });
    setImgRepInfoList(ImageRepInfo);
  };
  const commitDimensionLines = (dimensionLines: DimensionLine[]) => {
    pushHistory({
      texts: textInfoList,
      lines: lines,
      imgs: imgRepInfoList,
      dimensionLines: dimensionLines,
    });
    setDimensionLineList(dimensionLines);
  };

  const getCleanKonvaImage = async (presignedUrl: string): Promise<HTMLImageElement | undefined> => {
    try {
      // R2 presigned URL 을 브라우저가 직접 xhr 로 받으면 CORS 가 걸리므로,
      // 오브젝트 키를 추출해 같은 오리진 백엔드 프록시(/common/fileProxy)로 받는다.
      let response;
      const isR2 = /r2\.cloudflarestorage\.com/.test(presignedUrl) || /[?&]X-Amz-Signature=/.test(presignedUrl);
      if (isR2) {
        const u = new URL(presignedUrl);
        // pathname: /<bucket>/<key...> → 첫 세그먼트(bucket) 제거한 나머지가 오브젝트 키(sysFileNm)
        const fileKey = decodeURIComponent(u.pathname.replace(/^\/[^/]+\//, ''));
        response = await authApi.get('/common/fileProxy', { params: { fileKey }, responseType: 'blob' });
      } else {
        // 로컬 blob URL 등 R2 가 아닌 경우는 그대로 사용
        response = await axios.get(presignedUrl, { responseType: 'blob' });
      }

      // 내 도메인 소속의 임시 URL로 만듭니다. (신분 세탁)
      const blobUrl = URL.createObjectURL(response.data);

      // 3. Konva용 이미지 객체를 생성합니다.
      return new Promise((resolve) => {
        const img = new window.Image();
        // 내 로컬 데이터이므로 사실 필요 없지만, 안전을 위해 넣어줍니다.
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          resolve(img); // 이제 이 img를 Konva.Image({ image: img })에 넣으세요!
        };
        img.src = blobUrl;
      });
    } catch (error) {
      console.error('이미지 로드 실패:', error);
    }
  };

  const handleUndo = () => {
    const prev = undo();
    if (prev) {
      setTextInfoList(prev.texts);
      setLines(prev.lines);
      setImgRepInfoList(prev.imgs);
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setTextInfoList(next.texts);
      setLines(next.lines);
      setImgRepInfoList(next.imgs);
    }
  };

  const syncDimensionsState = (dimensions: { width?: number; height?: number }) => {
    setDimensions((prevState) => {
      return {
        ...prevState,
        ...dimensions,
      };
    });
  };

  /** 참조를 통해 외부로 노출되는 영역을 정의함 */
  useImperativeHandle<Konva.Stage, CanvasByKonvaRef>(ref, () => {
    return Object.assign<Konva.Stage, CanvasByKonvaCustomsRef>(stageRef.current ?? ({} as any), {
      customs: {
        api: {
          addNewText: (value) => {
            commitTextInfo([
              ...textInfoList,
              {
                color: textConfig?.color,
                content: value ? value : '신규 작성',
                x: 50,
                y: 50,
                // width: value ? value.length * 20 : 200,
                // height: 20,
                width: value
                  ? value.length *
                    (textConfig?.scale
                      ? textConfig?.scale < 20
                        ? textConfig?.scale < 16
                          ? textConfig?.scale < 10
                            ? textConfig?.scale * 3
                            : textConfig?.scale * 1.8
                          : textConfig?.scale * 1.2
                        : textConfig?.scale
                      : 20)
                  : 20 * 5,
                height: textConfig?.scale
                  ? textConfig?.scale < 20
                    ? textConfig?.scale < 16
                      ? textConfig?.scale < 10
                        ? textConfig?.scale * 3
                        : textConfig?.scale * 1.8
                      : textConfig?.scale * 1.2
                    : textConfig?.scale
                  : 20,
                // scaleX: 1,
                // scaleY: 1,
                scaleX: (textConfig?.scale || 20) / 20,
                scaleY: (textConfig?.scale || 20) / 20,
                rotation: 0,
              },
            ]);
          },
          addNewDimensionLine: () => {
            commitDimensionLines([
              ...dimensionLineList,
              {
                points: [100, 100, 300, 100],
                color: lineConfig?.color, // 드로잉(line) 색을 추종

                x: 70,
                y: 70,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
              },
            ]);
          },
          async exportAsFile(fileName) {
            if (!stageRef.current) {
              console.error('stage 참조를 찾을 수 없음');
              return null;
            }

            const snapshotsStat = getState();
            if (
              snapshotsStat.lines.length == 0 && // line
              snapshotsStat.texts.length == 0 && // 텍스트
              snapshotsStat.imgs.length == 0 && // 이미지
              snapshotsStat.dimensionLines.length == 0 // 치수선에 대한 어떠한 편집도 일어나지 아니한 경우
            ) {
              return null; // 어떠한 편집 동작도 이루어지지 않은 상태에서는 동작하지 아니함
            }

            const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
            const res = await fetch(dataUrl);
            const blob = await res.blob();

            return new File(
              [blob],
              fileName ? fileName : img?.imgFileName ? path.basename(img?.imgFileName, path.extname(img?.imgFileName)) + '_mod_by_konva' : 'canvas_image',
              { type: 'image/png' },
            );
          },
          undo: handleUndo,
          redo: handleRedo,
        },
      },
    });
  });

  useEffect(() => {
    // 이미지 정보 변경 시점에 필요한 초기화(혹은 동기화) 동작
    const stageWidth = wrapperRef.current?.offsetWidth || 0;
    const stageHeight = wrapperRef.current?.offsetHeight || 0;

    if (img && img.imgSrc) {
      getCleanKonvaImage(img.imgSrc).then((image) => {
        if (image) {
          // 1. 비율 계산 (비교)
          const widthRatio = stageWidth / image.width;
          const heightRatio = stageHeight / image.height;

          // 2. contain 방식: 둘 중 더 작은 비율을 선택
          const newScale = Math.min(widthRatio, heightRatio); // 비율(scale)

          // 3. 실질적인 너비와 높이 구하기
          const scaledWidth = image.width * newScale;
          const scaledHeight = image.height * newScale;

          const finalWidth = scaledWidth == stageWidth ? stageWidth : scaledWidth;
          const finalHeight = scaledHeight == stageHeight ? stageHeight : scaledHeight;

          syncDimensionsState({
            width: finalWidth,
            height: finalHeight,
          });

          // 4. 중앙 정렬을 위한 좌표(x, y) 구하기
          // const x = (stageWidth - finalWidth) / 2;
          // const y = (stageHeight - finalHeight) / 2;

          // 최초 set State 이후에도 여전히 최초 요소 자리를 유지하여야(요소 순으로 z indexing)
          setMainImgRepInfo({
            src: image.src,
            width: finalWidth,
            height: finalHeight,
            x: 0,
            y: 0,

            scaleX: newScale,
            scaleY: newScale,
            rotation: 0,
          });
        }
      });
    }

    if (!img || img.imgSrc == undefined) {
      // 이미지 정보 부재한 경우 화이트보드 랜더링
      syncDimensionsState({
        width: stageWidth,
        height: stageHeight,
      });

      setMainImgRepInfo(undefined);
    }
  }, [img]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const targetName: string = e.target.name();

    if (preventDrawing) {
      return; // 클라이언트 의사에 따라 드로잉 이벤트 차단
    }

    if (preview) {
      return; // 미리보기 활성화 시점에 드로잉 이벤트 차단
    }

    if (targetName === 'undo-btn' || targetName === 'redo-btn') {
      return; // 드로잉 이벤트 차단
    }

    if (targetName === 'text-with-tr' || targetName === 'img-with-tr' || targetName === 'arrow-with-tr' || targetName.includes('anchor')) {
      return; // text, img 드래깅 시점에서 비활성, 혹은 변환을 위한 anchor 영역에서 그러함
    }

    isDrawing.current = true;
    const pos = e.target.getStage()!.getPointerPosition();
    commitLines([...lines, { tool, points: [pos!.x, pos!.y], color: lineConfig?.color, width: lineConfig?.width ? lineConfig?.width * 0.6 : 5 }]); // 최초 마우스 down 시점, width 값은 적절한 상수(0.6)로 별도 스케일링 처리
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage!.getPointerPosition();
    let lastLine = { ...lines[lines.length - 1] };

    // add point
    lastLine.points = lastLine.points.concat([point!.x, point!.y]); // 이동에 따른 신규 포인트 추가(concat 으로 병합)

    // replace last
    const splicedLines = [...lines];
    splicedLines.splice(splicedLines.length - 1, 1, lastLine);
    commitLines(splicedLines.concat());
  };

  // 마우스를 놓음
  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // 마우스 이탈
  const handleMouseLeave = () => {
    isDrawing.current = false;
  };

  // 파일 검증 및 추가 공통 로직
  const processFiles = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const addedImgRepInfoList: ImageRepInfo[] = [...imgRepInfoList];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        return; // 전체 무효
      }
      validFiles.push(file);
    }

    for (let i = 0; i < validFiles.length; i++) {
      const image = new window.Image();
      image.src = URL.createObjectURL(validFiles[i]);
      image.onload = () => {
        const stageWidth = wrapperRef.current?.offsetWidth || 0;
        const stageHeight = wrapperRef.current?.offsetHeight || 0;

        if (wrapperRef.current) {
          setDimensions({
            width: stageWidth,
            height: stageHeight,
          });
        }

        // 1. 비율 계산 (비교)
        const widthRatio = stageWidth / image.width;
        const heightRatio = stageHeight / image.height;

        // 2. contain 방식: 둘 중 더 작은 비율을 선택
        const newScale = Math.min(widthRatio, heightRatio); // 비율(scale)

        // 3. 실질적인 너비와 높이 구하기(최초에는 1/5으로 축소)
        const finalWidth = image.width * newScale;
        const finalHeight = image.height * newScale;

        // 4. 좌측 상단에서부터 다소 겹치게끔 정의
        const x = (stageWidth - finalWidth) / 2;
        const y = (stageHeight - finalHeight) / 2;

        addedImgRepInfoList.push({
          //image: image,
          src: image.src,
          width: finalWidth,
          height: finalHeight,
          x: x,
          y: y,

          scaleX: newScale,
          scaleY: newScale,
          rotation: 0,
        });
      };
    }

    commitImages(addedImgRepInfoList);
  };

  return (
    <div
      onDragEnter={(e: React.DragEvent<HTMLDivElement>) => {
        // 브라우저 고유 이벤트 차단
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
        // 브라우저 고유 이벤트 차단
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        // 브라우저 고유 이벤트 차단
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(Array.from(e.dataTransfer.files));
        }
      }}
      tabIndex={0} // 포커싱 가능(paste 동작 가능해짐)
      style={{ outline: 'none' }}
      onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          processFiles(Array.from(e.clipboardData.files));
        }
      }}
    >
      <Stage
        {...(dimensions as any)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        ref={stageRef}
      >
        <Layer>
          {mainImgRepInfo && <MainImage imgRepInfo={mainImgRepInfo} />}
          {imgRepInfoList.map((imgRepInfo, index) => (
            <TransformableImage
              key={index}
              imgRepInfo={imgRepInfo}
              enablePreviewMode={preview}
              onTransformed={(evt) => {
                commitImages(
                  imgRepInfoList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        ...evt,
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
              onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                commitImages(
                  imgRepInfoList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
            />
          ))}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color || 'black'}
              strokeWidth={line.width || 5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
            />
          ))}
          {dimensionLineList.map((dimensionLine, index) => (
            <DimensionLine
              key={index}
              enablePreviewMode={preview}
              onTransformed={(evt) => {
                commitDimensionLines(
                  dimensionLineList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        ...evt,
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
              onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                commitDimensionLines(
                  dimensionLineList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
              dimensionLine={dimensionLine}
            />
          ))}
          {textInfoList.map((textInfo, index) => (
            <EditableText
              key={index}
              textInfo={textInfo}
              enablePreviewMode={preview}
              onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                commitTextInfo(
                  textInfoList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
              onTransformed={(evt) => {
                commitTextInfo(
                  textInfoList.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        ...evt,
                      };
                    } else {
                      return prev;
                    }
                  }),
                );
              }}
              onChangeByEditor={(evt) => {
                if (evt.content != undefined && evt.content == '') {
                  // 텍스트 공란인 경우 지움 동작
                  commitTextInfo(textInfoList.filter((_, prevI) => prevI != index));
                } else {
                  // 그 외
                  commitTextInfo(
                    textInfoList.map((prev, prevI) => {
                      if (prevI == index) {
                        return {
                          ...prev,
                          ...evt,
                        };
                      } else {
                        return prev;
                      }
                    }),
                  );
                }
              }}
            />
          ))}
          {!preview && enableEmbeddedUndoRedoBtn && (
            <>
              <Image name="undo-btn" x={0} y={0} onClick={handleUndo} image={undoImg} width={12} height={12} scaleX={1} scaleY={1} />
              <Image name="redo-btn" x={20} y={0} onClick={handleRedo} image={redoImg} width={12} height={12} scaleX={1} scaleY={1} />
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasByKonva;
