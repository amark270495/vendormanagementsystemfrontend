// src/pages/MSATemplateEditorPage.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createDefaultTemplate,
  createEmptyParagraphBlock,
  createEmptyTableBlock,
  deepCloneTemplate,
  DYNAMIC_FIELDS,
  FIELD_BY_TOKEN,
  makeBlockId,
  TEMPLATE_STORAGE_KEY,
} from "../components/msa-wo/MSATemplateDefinition";

import {
  MSATemplatePages,
} from "../components/msa-wo/MSATemplatePages";

import "../components/msa-wo/MSADocumentStyles.css";

const FONT_OPTIONS = [
  '"Times New Roman", Times, serif',
  "Arial, Helvetica, sans-serif",
  'Georgia, "Times New Roman", serif',
  '"Courier New", Courier, monospace',
];

const ToolbarButton = ({
  children,
  title,
  onMouseDown,
}) => (
  <button
    type="button"
    title={title}
    className="wysiwyg-toolbar-button"
    onMouseDown={(
      event
    ) => {
      event.preventDefault();

      onMouseDown?.(
        event
      );
    }}
  >
    {children}
  </button>
);

const EditorSection = ({
  title,
  children,
  defaultOpen = true,
}) => (
  <details
    className="editor-section-details"
    open={defaultOpen}
  >
    <summary>
      {title}
    </summary>

    <div className="editor-section-content">
      {children}
    </div>
  </details>
);

const MSATemplateEditorPage =
  () => {
    const [
      template,
      setTemplate,
    ] =
      useState(() =>
        createDefaultTemplate()
      );

    const [
      editMode,
      setEditMode,
    ] =
      useState(true);

    const [
      selectedBlockId,
      setSelectedBlockId,
    ] =
      useState(null);

    const [
      savedVersions,
      setSavedVersions,
    ] =
      useState([]);

    const [
      overflowPages,
      setOverflowPages,
    ] =
      useState({});

    const [
      statusMessage,
      setStatusMessage,
    ] =
      useState("");

    const activeEditableRef =
      useRef(null);

    const savedRangeRef =
      useRef(null);

    const importInputRef =
      useRef(null);

    const statusTimerRef =
      useRef(null);

    useEffect(() => {
      const stored =
        localStorage.getItem(
          TEMPLATE_STORAGE_KEY
        );

      if (!stored) {
        return;
      }

      try {
        const parsed =
          JSON.parse(
            stored
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setSavedVersions(
            parsed
          );
        }
      } catch (error) {
        console.error(
          "Unable to load template history",
          error
        );
      }
    }, []);

    const fieldGroups =
      useMemo(() => {
        return DYNAMIC_FIELDS.reduce(
          (
            groups,
            field
          ) => {
            groups[
              field.group
            ] =
              groups[
                field.group
              ] || [];

            groups[
              field.group
            ].push(field);

            return groups;
          },

          {}
        );
      }, []);

    const showMessage = (
      message
    ) => {
      setStatusMessage(
        message
      );

      if (
        statusTimerRef.current
      ) {
        clearTimeout(
          statusTimerRef.current
        );
      }

      statusTimerRef.current =
        setTimeout(
          () => {
            setStatusMessage(
              ""
            );
          },

          3500
        );
    };

    const registerEditable =
      (element) => {
        if (!element) {
          return;
        }

        activeEditableRef.current =
          element;

        const selection =
          window.getSelection();

        if (
          selection &&
          selection.rangeCount >
            0 &&
          element.contains(
            selection.anchorNode
          )
        ) {
          savedRangeRef.current =
            selection
              .getRangeAt(0)
              .cloneRange();
        }
      };

    const restoreSelection =
      () => {
        const range =
          savedRangeRef.current;

        activeEditableRef.current?.focus();

        if (!range) {
          return;
        }

        const selection =
          window.getSelection();

        selection.removeAllRanges();

        selection.addRange(
          range
        );
      };

    const executeCommand = (
      command,
      value = null
    ) => {
      if (!editMode) {
        return;
      }

      restoreSelection();

      document.execCommand(
        command,
        false,
        value
      );

      registerEditable(
        activeEditableRef.current
      );
    };

    const applyFontSize = (
      pointSize
    ) => {
      if (!editMode) {
        return;
      }

      restoreSelection();

      /*
       * execCommand fontSize uses HTML sizes 1-7.
       * We temporarily create size 7, then convert it
       * to an exact pt-size span.
       */
      document.execCommand(
        "fontSize",
        false,
        "7"
      );

      activeEditableRef.current
        ?.querySelectorAll(
          'font[size="7"]'
        )
        .forEach(
          (fontNode) => {
            const span =
              document.createElement(
                "span"
              );

            span.style.fontSize =
              `${pointSize}pt`;

            span.innerHTML =
              fontNode.innerHTML;

            fontNode.replaceWith(
              span
            );
          }
        );

      registerEditable(
        activeEditableRef.current
      );
    };

    const insertDynamicField =
      (token) => {
        if (!editMode) {
          return;
        }

        const field =
          FIELD_BY_TOKEN[
            token
          ];

        if (!field) {
          return;
        }

        restoreSelection();

        const selection =
          window.getSelection();

        if (
          !selection ||
          selection.rangeCount ===
            0
        ) {
          return;
        }

        const range =
          selection.getRangeAt(
            0
          );

        const chip =
          document.createElement(
            "span"
          );

        chip.className =
          "dynamic-field-chip";

        chip.dataset.fieldToken =
          token;

        chip.contentEditable =
          "false";

        chip.textContent =
          field.label;

        range.deleteContents();

        range.insertNode(
          chip
        );

        range.setStartAfter(
          chip
        );

        range.collapse(
          true
        );

        selection.removeAllRanges();

        selection.addRange(
          range
        );

        savedRangeRef.current =
          range.cloneRange();

        activeEditableRef.current?.focus();
      };

    const updateTemplate = (
      updater
    ) => {
      setTemplate(
        (current) => {
          const next =
            typeof updater ===
            "function"
              ? updater(
                  current
                )
              : updater;

          return {
            ...next,

            updatedAt:
              new Date().toISOString(),
          };
        }
      );
    };

    const updateStyle = (
      key,
      value
    ) => {
      updateTemplate(
        (current) => ({
          ...current,

          styleConfig: {
            ...current.styleConfig,

            [key]:
              value,
          },
        })
      );
    };

    const updateDocumentData = (
      key,
      value
    ) => {
      updateTemplate(
        (current) => ({
          ...current,

          documentData: {
            ...current.documentData,

            [key]:
              value,
          },
        })
      );
    };

    const updateHtmlBlock = (
      blockId,
      html
    ) => {
      updateTemplate(
        (current) => ({
          ...current,

          pages:
            current.pages.map(
              (page) => ({
                ...page,

                blocks:
                  page.blocks.map(
                    (
                      block
                    ) =>
                      block.id ===
                      blockId
                        ? {
                            ...block,
                            html,
                          }
                        : block
                  ),
              })
            ),
        })
      );
    };

    const updateTableCell = (
      blockId,
      rowIndex,
      cellIndex,
      html
    ) => {
      updateTemplate(
        (current) => ({
          ...current,

          pages:
            current.pages.map(
              (page) => ({
                ...page,

                blocks:
                  page.blocks.map(
                    (
                      block
                    ) => {
                      if (
                        block.id !==
                          blockId ||
                        block.type !==
                          "table"
                      ) {
                        return block;
                      }

                      return {
                        ...block,

                        rows:
                          block.rows.map(
                            (
                              row,
                              currentRow
                            ) =>
                              row.map(
                                (
                                  cell,
                                  currentCell
                                ) =>
                                  currentRow ===
                                    rowIndex &&
                                  currentCell ===
                                    cellIndex
                                    ? {
                                        ...cell,
                                        html,
                                      }
                                    : cell
                              )
                          ),
                      };
                    }
                  ),
              })
            ),
        })
      );
    };

    const selectedLocation =
      useMemo(() => {
        for (
          let pageIndex =
            0;
          pageIndex <
          template.pages
            .length;
          pageIndex += 1
        ) {
          const blockIndex =
            template.pages[
              pageIndex
            ].blocks.findIndex(
              (block) =>
                block.id ===
                selectedBlockId
            );

          if (
            blockIndex >= 0
          ) {
            return {
              pageIndex,
              blockIndex,

              block:
                template.pages[
                  pageIndex
                ].blocks[
                  blockIndex
                ],
            };
          }
        }

        return null;
      }, [
        template.pages,
        selectedBlockId,
      ]);

    const mutateSelectedBlock = (
      callback
    ) => {
      if (
        !selectedLocation
      ) {
        return;
      }

      updateTemplate(
        (current) => {
          const pages =
            deepCloneTemplate(
              current.pages
            );

          callback(
            pages,
            selectedLocation.pageIndex,
            selectedLocation.blockIndex
          );

          return {
            ...current,
            pages,
          };
        }
      );
    };

    const addParagraphAfter =
      () => {
        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            pages[
              pageIndex
            ].blocks.splice(
              blockIndex +
                1,

              0,

              createEmptyParagraphBlock()
            );
          }
        );
      };

    const addTableAfter =
      () => {
        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            pages[
              pageIndex
            ].blocks.splice(
              blockIndex +
                1,

              0,

              createEmptyTableBlock()
            );
          }
        );
      };

    const duplicateSelectedBlock =
      () => {
        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            const duplicate =
              deepCloneTemplate(
                pages[
                  pageIndex
                ].blocks[
                  blockIndex
                ]
              );

            duplicate.id =
              makeBlockId();

            pages[
              pageIndex
            ].blocks.splice(
              blockIndex +
                1,

              0,

              duplicate
            );
          }
        );
      };

    const deleteSelectedBlock =
      () => {
        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            pages[
              pageIndex
            ].blocks.splice(
              blockIndex,
              1
            );
          }
        );

        setSelectedBlockId(
          null
        );
      };

    const moveSelectedBlock = (
      direction
    ) => {
      mutateSelectedBlock(
        (
          pages,
          pageIndex,
          blockIndex
        ) => {
          const blocks =
            pages[
              pageIndex
            ].blocks;

          const targetIndex =
            blockIndex +
            direction;

          if (
            targetIndex <
              0 ||
            targetIndex >=
              blocks.length
          ) {
            return;
          }

          const [block] =
            blocks.splice(
              blockIndex,
              1
            );

          blocks.splice(
            targetIndex,
            0,
            block
          );
        }
      );
    };

    const moveToPage = (
      direction
    ) => {
      mutateSelectedBlock(
        (
          pages,
          pageIndex,
          blockIndex
        ) => {
          const targetIndex =
            pageIndex +
            direction;

          if (
            targetIndex <
              0 ||
            targetIndex >=
              pages.length
          ) {
            return;
          }

          if (
            pages[
              pageIndex
            ].part !==
            pages[
              targetIndex
            ].part
          ) {
            return;
          }

          const [block] =
            pages[
              pageIndex
            ].blocks.splice(
              blockIndex,
              1
            );

          if (
            direction <
            0
          ) {
            pages[
              targetIndex
            ].blocks.push(
              block
            );
          } else {
            pages[
              targetIndex
            ].blocks.unshift(
              block
            );
          }
        }
      );
    };

    const addTableRow =
      () => {
        if (
          !selectedLocation ||
          selectedLocation
            .block.type !==
            "table"
        ) {
          return;
        }

        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            const table =
              pages[
                pageIndex
              ].blocks[
                blockIndex
              ];

            const count =
              table.rows[
                0
              ]?.length ||
              2;

            table.rows.push(
              Array.from(
                {
                  length:
                    count,
                },

                () => ({
                  html:
                    "New cell",
                })
              )
            );
          }
        );
      };

    const removeTableRow =
      () => {
        if (
          !selectedLocation ||
          selectedLocation
            .block.type !==
            "table"
        ) {
          return;
        }

        mutateSelectedBlock(
          (
            pages,
            pageIndex,
            blockIndex
          ) => {
            const table =
              pages[
                pageIndex
              ].blocks[
                blockIndex
              ];

            if (
              table.rows
                .length >
              1
            ) {
              table.rows.pop();
            }
          }
        );
      };

    const persistVersions = (
      versions
    ) => {
      setSavedVersions(
        versions
      );

      localStorage.setItem(
        TEMPLATE_STORAGE_KEY,

        JSON.stringify(
          versions
        )
      );
    };

    const saveDraft =
      () => {
        const draft = {
          ...deepCloneTemplate(
            template
          ),

          status:
            "DRAFT",

          updatedAt:
            new Date().toISOString(),
        };

        const others =
          savedVersions.filter(
            (item) =>
              !(
                item.templateId ===
                  draft.templateId &&
                Number(
                  item.version
                ) ===
                  Number(
                    draft.version
                  )
              )
          );

        persistVersions([
          ...others,
          draft,
        ]);

        setTemplate(
          draft
        );

        showMessage(
          `Draft v${draft.version} saved.`
        );
      };

    const getNextVersion =
      () => {
        const versions =
          savedVersions
            .filter(
              (item) =>
                item.templateId ===
                template.templateId
            )
            .map(
              (item) =>
                Number(
                  item.version
                ) || 0
            );

        versions.push(
          Number(
            template.version
          ) || 0
        );

        return (
          Math.max(
            ...versions
          ) + 1
        );
      };

    const createNewVersion =
      () => {
        const next = {
          ...deepCloneTemplate(
            template
          ),

          version:
            getNextVersion(),

          status:
            "DRAFT",

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };

        persistVersions([
          ...savedVersions,
          next,
        ]);

        setTemplate(
          next
        );

        setEditMode(
          true
        );

        showMessage(
          `Created draft v${next.version}.`
        );
      };

    const publishTemplate =
      () => {
        const now =
          new Date().toISOString();

        const active = {
          ...deepCloneTemplate(
            template
          ),

          status:
            "ACTIVE",

          updatedAt:
            now,
        };

        const others =
          savedVersions
            .filter(
              (item) =>
                !(
                  item.templateId ===
                    template.templateId &&
                  Number(
                    item.version
                  ) ===
                    Number(
                      template.version
                    )
                )
            )
            .map(
              (item) =>
                item.templateId ===
                  template.templateId &&
                item.status ===
                  "ACTIVE"
                  ? {
                      ...item,

                      status:
                        "ARCHIVED",

                      updatedAt:
                        now,
                    }
                  : item
            );

        persistVersions([
          ...others,
          active,
        ]);

        setTemplate(
          active
        );

        setEditMode(
          false
        );

        showMessage(
          `Version ${active.version} published.`
        );
      };

    const beginEditing =
      () => {
        if (
          template.status ===
          "ACTIVE"
        ) {
          const next = {
            ...deepCloneTemplate(
              template
            ),

            version:
              getNextVersion(),

            status:
              "DRAFT",

            createdAt:
              new Date().toISOString(),

            updatedAt:
              new Date().toISOString(),
          };

          setTemplate(
            next
          );

          setSelectedBlockId(
            null
          );

          setEditMode(
            true
          );

          showMessage(
            `Published version preserved. Editing new draft v${next.version}.`
          );

          return;
        }

        setEditMode(
          true
        );
      };

    const loadVersion = (
      version
    ) => {
      const found =
        savedVersions.find(
          (item) =>
            item.templateId ===
              template.templateId &&
            Number(
              item.version
            ) ===
              Number(
                version
              )
        );

      if (!found) {
        return;
      }

      setTemplate(
        deepCloneTemplate(
          found
        )
      );

      setEditMode(
        false
      );

      setSelectedBlockId(
        null
      );

      showMessage(
        `Loaded version ${found.version}.`
      );
    };

    const resetTemplate =
      () => {
        setTemplate(
          createDefaultTemplate()
        );

        setSelectedBlockId(
          null
        );

        setOverflowPages(
          {}
        );

        setEditMode(
          true
        );

        showMessage(
          "Restored master template."
        );
      };

    const exportJson =
      () => {
        const blob =
          new Blob(
            [
              JSON.stringify(
                template,
                null,
                2
              ),
            ],

            {
              type:
                "application/json",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          url;

        link.download =
          `${template.templateId}-v${template.version}.json`;

        link.click();

        URL.revokeObjectURL(
          url
        );
      };

    const importJson =
      (event) => {
        const file =
          event.target
            .files?.[0];

        if (!file) {
          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          () => {
            try {
              const parsed =
                JSON.parse(
                  reader.result
                );

              if (
                !parsed.pages ||
                !parsed.styleConfig
              ) {
                throw new Error(
                  "Invalid template JSON."
                );
              }

              setTemplate(
                parsed
              );

              setEditMode(
                true
              );

              setSelectedBlockId(
                null
              );

              showMessage(
                "Template imported."
              );
            } catch (
              error
            ) {
              alert(
                error.message
              );
            }
          };

        reader.readAsText(
          file
        );

        event.target.value =
          "";
      };

    const printDocument =
      () => {
        const previousMode =
          editMode;

        setEditMode(
          false
        );

        document.body.classList.add(
          "msa-print-mode"
        );

        const cleanup =
          () => {
            document.body.classList.remove(
              "msa-print-mode"
            );

            window.removeEventListener(
              "afterprint",
              cleanup
            );

            if (
              previousMode
            ) {
              setEditMode(
                true
              );
            }
          };

        window.addEventListener(
          "afterprint",
          cleanup
        );

        requestAnimationFrame(
          () => {
            requestAnimationFrame(
              () => {
                window.print();
              }
            );
          }
        );
      };

    const handleOverflow = (
      pageId,
      overflowing
    ) => {
      setOverflowPages(
        (current) => {
          if (
            current[
              pageId
            ] ===
            overflowing
          ) {
            return current;
          }

          return {
            ...current,

            [pageId]:
              overflowing,
          };
        }
      );
    };

    const overflowList =
      Object.entries(
        overflowPages
      )
        .filter(
          ([
            ,
            value,
          ]) => value
        )
        .map(
          ([
            pageId,
          ]) => pageId
        );

    return (
      <div className="msa-editor-app">

        <div className="wysiwyg-topbar no-print">

          <div className="wysiwyg-topbar-left">

            <div>

              <div className="wysiwyg-editor-name">
                MSA / WO Template Editor
              </div>

              <div className="wysiwyg-editor-meta">
                {template.templateName}
                {" • "}
                Version{" "}
                {template.version}
                {" • "}
                {template.status}
              </div>

            </div>

            <div className="editor-mode-switch">

              <button
                type="button"
                className={
                  !editMode
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setEditMode(
                    false
                  )
                }
              >
                Preview
              </button>

              <button
                type="button"
                className={
                  editMode
                    ? "active"
                    : ""
                }
                onClick={
                  beginEditing
                }
              >
                Edit Document
              </button>

            </div>

          </div>

          <div className="wysiwyg-topbar-actions">

            <button
              type="button"
              onClick={
                saveDraft
              }
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={
                createNewVersion
              }
            >
              Save As Version
            </button>

            <button
              type="button"
              className="publish"
              onClick={
                publishTemplate
              }
            >
              Publish
            </button>

            <button
              type="button"
              className="print"
              onClick={
                printDocument
              }
            >
              Print / PDF
            </button>

          </div>

        </div>

        <div className="wysiwyg-toolbar no-print">

          <div className="toolbar-group">

            <ToolbarButton
              title="Undo"
              onMouseDown={() =>
                executeCommand(
                  "undo"
                )
              }
            >
              ↶
            </ToolbarButton>

            <ToolbarButton
              title="Redo"
              onMouseDown={() =>
                executeCommand(
                  "redo"
                )
              }
            >
              ↷
            </ToolbarButton>

          </div>

          <div className="toolbar-group">

            <ToolbarButton
              title="Bold"
              onMouseDown={() =>
                executeCommand(
                  "bold"
                )
              }
            >
              <strong>
                B
              </strong>
            </ToolbarButton>

            <ToolbarButton
              title="Italic"
              onMouseDown={() =>
                executeCommand(
                  "italic"
                )
              }
            >
              <em>
                I
              </em>
            </ToolbarButton>

            <ToolbarButton
              title="Underline"
              onMouseDown={() =>
                executeCommand(
                  "underline"
                )
              }
            >
              <u>
                U
              </u>
            </ToolbarButton>

            <ToolbarButton
              title="Strike"
              onMouseDown={() =>
                executeCommand(
                  "strikeThrough"
                )
              }
            >
              S
            </ToolbarButton>

          </div>

          <div className="toolbar-group">

            <select
              defaultValue=""
              onMouseDown={
                restoreSelection
              }
              onChange={(
                event
              ) => {
                if (
                  event.target
                    .value
                ) {
                  executeCommand(
                    "fontName",
                    event.target
                      .value
                  );
                }

                event.target.value =
                  "";
              }}
            >
              <option value="">
                Font
              </option>

              <option value="Times New Roman">
                Times New Roman
              </option>

              <option value="Arial">
                Arial
              </option>

              <option value="Georgia">
                Georgia
              </option>

              <option value="Courier New">
                Courier New
              </option>
            </select>

            <select
              defaultValue=""
              onMouseDown={
                restoreSelection
              }
              onChange={(
                event
              ) => {
                if (
                  event.target
                    .value
                ) {
                  applyFontSize(
                    event.target
                      .value
                  );
                }

                event.target.value =
                  "";
              }}
            >
              <option value="">
                Size
              </option>

              {[
                8,
                9,
                10,
                10.5,
                11,
                12,
                14,
                16,
                18,
                24,
                30,
              ].map(
                (
                  value
                ) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      value
                    }{" "}
                    pt
                  </option>
                )
              )}
            </select>

          </div>

          <div className="toolbar-group">

            <ToolbarButton
              title="Align left"
              onMouseDown={() =>
                executeCommand(
                  "justifyLeft"
                )
              }
            >
              ⇤
            </ToolbarButton>

            <ToolbarButton
              title="Center"
              onMouseDown={() =>
                executeCommand(
                  "justifyCenter"
                )
              }
            >
              ≡
            </ToolbarButton>

            <ToolbarButton
              title="Align right"
              onMouseDown={() =>
                executeCommand(
                  "justifyRight"
                )
              }
            >
              ⇥
            </ToolbarButton>

            <ToolbarButton
              title="Justify"
              onMouseDown={() =>
                executeCommand(
                  "justifyFull"
                )
              }
            >
              ☰
            </ToolbarButton>

          </div>

          <div className="toolbar-group">

            <ToolbarButton
              title="Numbered list"
              onMouseDown={() =>
                executeCommand(
                  "insertOrderedList"
                )
              }
            >
              1.
            </ToolbarButton>

            <ToolbarButton
              title="Bullet list"
              onMouseDown={() =>
                executeCommand(
                  "insertUnorderedList"
                )
              }
            >
              •
            </ToolbarButton>

            <ToolbarButton
              title="Outdent"
              onMouseDown={() =>
                executeCommand(
                  "outdent"
                )
              }
            >
              ←
            </ToolbarButton>

            <ToolbarButton
              title="Indent"
              onMouseDown={() =>
                executeCommand(
                  "indent"
                )
              }
            >
              →
            </ToolbarButton>

          </div>

          <div className="toolbar-group">

            <label className="toolbar-color-label">

              A

              <input
                type="color"
                defaultValue="#000000"
                onMouseDown={
                  restoreSelection
                }
                onChange={(
                  event
                ) =>
                  executeCommand(
                    "foreColor",
                    event.target
                      .value
                  )
                }
              />

            </label>

            <label className="toolbar-color-label">

              ▰

              <input
                type="color"
                defaultValue="#ffff00"
                onMouseDown={
                  restoreSelection
                }
                onChange={(
                  event
                ) =>
                  executeCommand(
                    "hiliteColor",
                    event.target
                      .value
                  )
                }
              />

            </label>

            <ToolbarButton
              title="Clear formatting"
              onMouseDown={() =>
                executeCommand(
                  "removeFormat"
                )
              }
            >
              Tx
            </ToolbarButton>

            <ToolbarButton
              title="Horizontal rule"
              onMouseDown={() =>
                executeCommand(
                  "insertHorizontalRule"
                )
              }
            >
              ―
            </ToolbarButton>

          </div>

          <div className="toolbar-group">

            <select
              className="insert-field-select"
              defaultValue=""
              onMouseDown={
                restoreSelection
              }
              onChange={(
                event
              ) => {
                const token =
                  event.target
                    .value;

                if (token) {
                  insertDynamicField(
                    token
                  );
                }

                event.target.value =
                  "";
              }}
            >

              <option value="">
                + Insert VMS Field
              </option>

              {Object.entries(
                fieldGroups
              ).map(
                ([
                  group,
                  fields,
                ]) => (
                  <optgroup
                    key={
                      group
                    }
                    label={
                      group
                    }
                  >
                    {fields.map(
                      (
                        field
                      ) => (
                        <option
                          key={
                            field.token
                          }
                          value={
                            field.token
                          }
                        >
                          {
                            field.label
                          }
                        </option>
                      )
                    )}
                  </optgroup>
                )
              )}

            </select>

          </div>

        </div>

        <div className="document-editor-layout">

          <aside className="document-sidebar no-print">

            {statusMessage && (
              <div className="editor-success-message">
                {
                  statusMessage
                }
              </div>
            )}

            {overflowList.length >
              0 && (
              <div className="editor-overflow-warning">

                <strong>
                  Page overflow detected
                </strong>

                <div>
                  {overflowList.join(
                    ", "
                  )}
                </div>

                <small>
                  Reduce text or
                  spacing, or move a
                  block to another
                  page before
                  publishing.
                </small>

              </div>
            )}

            <EditorSection title="Document">

              <label className="editor-field">

                Package

                <select
                  value={
                    template.packageMode
                  }
                  onChange={(
                    event
                  ) =>
                    updateTemplate(
                      (
                        current
                      ) => ({
                        ...current,

                        packageMode:
                          event.target
                            .value,
                      })
                    )
                  }
                >

                  <option value="MSA_WO">
                    MSA + WO
                  </option>

                  <option value="MSA">
                    MSA Only
                  </option>

                  <option value="WO">
                    WO Only
                  </option>

                </select>

              </label>

              <label className="editor-field">

                Template Name

                <input
                  value={
                    template.templateName
                  }
                  onChange={(
                    event
                  ) =>
                    updateTemplate(
                      (
                        current
                      ) => ({
                        ...current,

                        templateName:
                          event.target
                            .value,
                      })
                    )
                  }
                />

              </label>

              <label className="editor-field">

                Logo URL

                <input
                  value={
                    template.logoUrl
                  }
                  onChange={(
                    event
                  ) =>
                    updateTemplate(
                      (
                        current
                      ) => ({
                        ...current,

                        logoUrl:
                          event.target
                            .value,
                      })
                    )
                  }
                />

              </label>

              <label className="editor-field">

                Footer Text

                <textarea
                  rows={3}
                  value={
                    template.footerText
                  }
                  onChange={(
                    event
                  ) =>
                    updateTemplate(
                      (
                        current
                      ) => ({
                        ...current,

                        footerText:
                          event.target
                            .value,
                      })
                    )
                  }
                />

              </label>

              <label className="editor-checkbox">

                <input
                  type="checkbox"
                  checked={
                    template.showPageNumbers
                  }
                  onChange={(
                    event
                  ) =>
                    updateTemplate(
                      (
                        current
                      ) => ({
                        ...current,

                        showPageNumbers:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                Show page numbers in preview

              </label>

            </EditorSection>

            <EditorSection title="Page Style">

              <div className="editor-grid-2">

                {[
                  [
                    "marginTop",
                    "Top Margin",
                  ],

                  [
                    "marginBottom",
                    "Bottom Margin",
                  ],

                  [
                    "marginLeft",
                    "Left Margin",
                  ],

                  [
                    "marginRight",
                    "Right Margin",
                  ],
                ].map(
                  ([
                    key,
                    label,
                  ]) => (
                    <label
                      key={
                        key
                      }
                      className="editor-field"
                    >

                      {label} (mm)

                      <input
                        type="number"
                        step="0.1"
                        value={
                          template
                            .styleConfig[
                            key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          updateStyle(
                            key,
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                      />

                    </label>
                  )
                )}

              </div>

              <label className="editor-field">

                Default Font

                <select
                  value={
                    template
                      .styleConfig
                      .fontFamily
                  }
                  onChange={(
                    event
                  ) =>
                    updateStyle(
                      "fontFamily",
                      event.target
                        .value
                    )
                  }
                >

                  {FONT_OPTIONS.map(
                    (
                      font
                    ) => (
                      <option
                        key={
                          font
                        }
                        value={
                          font
                        }
                      >
                        {font.replace(
                          /["']/g,
                          ""
                        )}
                      </option>
                    )
                  )}

                </select>

              </label>

              <div className="editor-grid-2">

                {[
                  [
                    "fontSize",
                    "Body Font",
                    0.1,
                  ],

                  [
                    "lineHeight",
                    "Line Height",
                    0.01,
                  ],

                  [
                    "titleSize",
                    "Title",
                    0.1,
                  ],

                  [
                    "sectionTitleSize",
                    "Section Title",
                    0.1,
                  ],

                  [
                    "logoWidth",
                    "Logo Width",
                    1,
                  ],

                  [
                    "footerFontSize",
                    "Footer Font",
                    0.1,
                  ],

                  [
                    "footerRuleWidth",
                    "Footer Rule",
                    0.1,
                  ],
                ].map(
                  ([
                    key,
                    label,
                    step,
                  ]) => (
                    <label
                      key={
                        key
                      }
                      className="editor-field"
                    >

                      {label}

                      <input
                        type="number"
                        step={
                          step
                        }
                        value={
                          template
                            .styleConfig[
                            key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          updateStyle(
                            key,
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                      />

                    </label>
                  )
                )}

                <label className="editor-field">

                  Footer Color

                  <input
                    type="color"
                    value={
                      template
                        .styleConfig
                        .footerRuleColor
                    }
                    onChange={(
                      event
                    ) =>
                      updateStyle(
                        "footerRuleColor",
                        event.target
                          .value
                      )
                    }
                  />

                </label>

              </div>

            </EditorSection>

            <EditorSection title="Selected Block">

              {!selectedLocation ? (
                <div className="editor-muted">
                  Click any paragraph,
                  clause, heading or
                  table cell inside the
                  document.
                </div>
              ) : (
                <>

                  <div className="selected-block-summary">

                    <strong>
                      {
                        selectedLocation
                          .block.id
                      }
                    </strong>

                    <span>
                      {
                        selectedLocation
                          .block.type
                      }
                    </span>

                  </div>

                  <div className="editor-actions two-columns">

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={() =>
                        moveSelectedBlock(
                          -1
                        )
                      }
                    >
                      Move Up
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={() =>
                        moveSelectedBlock(
                          1
                        )
                      }
                    >
                      Move Down
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={() =>
                        moveToPage(
                          -1
                        )
                      }
                    >
                      Previous Page
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={() =>
                        moveToPage(
                          1
                        )
                      }
                    >
                      Next Page
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={
                        addParagraphAfter
                      }
                    >
                      Add Paragraph
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={
                        addTableAfter
                      }
                    >
                      Add Table
                    </button>

                    <button
                      type="button"
                      className="editor-button light"
                      onClick={
                        duplicateSelectedBlock
                      }
                    >
                      Duplicate
                    </button>

                  </div>

                  {selectedLocation
                    .block.type ===
                    "table" && (
                    <div className="editor-actions two-columns">

                      <button
                        type="button"
                        className="editor-button light"
                        onClick={
                          addTableRow
                        }
                      >
                        Add Row
                      </button>

                      <button
                        type="button"
                        className="editor-button light"
                        onClick={
                          removeTableRow
                        }
                      >
                        Remove Row
                      </button>

                    </div>
                  )}

                  <button
                    type="button"
                    className="editor-button danger full"
                    onClick={
                      deleteSelectedBlock
                    }
                  >
                    Delete Block
                  </button>

                </>
              )}

            </EditorSection>

            <EditorSection
              title="Preview Data"
              defaultOpen={false}
            >

              {DYNAMIC_FIELDS.map(
                (
                  field
                ) => (
                  <label
                    key={
                      field.token
                    }
                    className="editor-field"
                  >

                    {
                      field.label
                    }

                    <input
                      value={
                        template
                          .documentData[
                          field.dataKey
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateDocumentData(
                          field.dataKey,

                          event.target
                            .value
                        )
                      }
                    />

                  </label>
                )
              )}

            </EditorSection>

            <EditorSection
              title="Versions & Backup"
              defaultOpen={false}
            >

              <label className="editor-field">

                Load Saved Version

                <select
                  value=""
                  onChange={(
                    event
                  ) =>
                    loadVersion(
                      event.target
                        .value
                    )
                  }
                >

                  <option value="">
                    Select version...
                  </option>

                  {savedVersions
                    .filter(
                      (
                        item
                      ) =>
                        item.templateId ===
                        template.templateId
                    )
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        Number(
                          b.version
                        ) -
                        Number(
                          a.version
                        )
                    )
                    .map(
                      (
                        item
                      ) => (
                        <option
                          key={`${item.templateId}-${item.version}`}
                          value={
                            item.version
                          }
                        >
                          v
                          {
                            item.version
                          }
                          {" - "}
                          {
                            item.status
                          }
                        </option>
                      )
                    )}

                </select>

              </label>

              <div className="editor-actions two-columns">

                <button
                  type="button"
                  className="editor-button light"
                  onClick={
                    exportJson
                  }
                >
                  Export JSON
                </button>

                <button
                  type="button"
                  className="editor-button light"
                  onClick={() =>
                    importInputRef.current?.click()
                  }
                >
                  Import JSON
                </button>

              </div>

              <input
                ref={
                  importInputRef
                }
                hidden
                type="file"
                accept=".json,application/json"
                onChange={
                  importJson
                }
              />

              <button
                type="button"
                className="editor-button danger full"
                onClick={
                  resetTemplate
                }
              >
                Reset Master Template
              </button>

            </EditorSection>

            <div className="editor-note">
              Dynamic Vendor,
              Candidate, Client and
              Work Order values are
              protected while editing.
              They resolve automatically
              during Preview and Print.
            </div>

          </aside>

          <main className="document-canvas">

            <MSATemplatePages
              template={
                template
              }
              editMode={
                editMode
              }
              selectedBlockId={
                selectedBlockId
              }
              registerEditable={
                registerEditable
              }
              onSelectBlock={(
                blockId,
                element
              ) => {
                setSelectedBlockId(
                  blockId
                );

                if (
                  element
                ) {
                  registerEditable(
                    element
                  );
                }
              }}
              onHtmlChange={
                updateHtmlBlock
              }
              onTableCellChange={
                updateTableCell
              }
              onOverflowChange={
                handleOverflow
              }
            />

          </main>

        </div>

      </div>
    );
  };

export default MSATemplateEditorPage;