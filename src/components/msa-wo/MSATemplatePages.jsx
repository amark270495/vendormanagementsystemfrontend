// src/components/msa-wo/MSATemplatePages.jsx

import React, {
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import "./MSADocumentStyles.css";

import {
  DEFAULT_LOGO_URL,
  resolveDynamicFields,
} from "./MSATemplateDefinition";

const EditableHtml = ({
  html,
  editMode,
  data,

  blockId,
  selected,

  registerEditable,

  onSelect,
  onChange,
}) => {
  const ref =
    useRef(null);

  const renderedHtml =
    useMemo(
      () =>
        resolveDynamicFields(
          html,
          data,
          editMode
        ),

      [
        html,
        data,
        editMode,
      ]
    );

  const activate = () => {
    if (
      !editMode ||
      !ref.current
    ) {
      return;
    }

    onSelect(
      blockId,
      ref.current
    );

    registerEditable(
      ref.current
    );
  };

  return (
    <div
      ref={ref}
      className={`editable-block ${
        editMode
          ? "is-editable"
          : ""
      } ${
        selected
          ? "is-selected"
          : ""
      }`}
      contentEditable={
        editMode
      }
      suppressContentEditableWarning
      spellCheck={
        editMode
      }
      dangerouslySetInnerHTML={{
        __html:
          renderedHtml,
      }}
      onFocus={
        activate
      }
      onClick={
        activate
      }
      onMouseUp={
        activate
      }
      onKeyUp={
        activate
      }
      onInput={(
        event
      ) => {
        if (editMode) {
          registerEditable(
            event.currentTarget
          );
        }
      }}
      onBlur={(
        event
      ) => {
        if (editMode) {
          onChange(
            blockId,

            event
              .currentTarget
              .innerHTML
          );
        }
      }}
    />
  );
};

const EditableTable = ({
  block,
  editMode,
  data,

  selectedBlockId,

  registerEditable,

  onSelect,
  onCellChange,
}) => (
  <div
    className={`editable-block table-block ${
      selectedBlockId ===
      block.id
        ? "is-selected"
        : ""
    }`}
    onClick={() =>
      onSelect(
        block.id,
        null
      )
    }
  >
    <table
      className={`doc-table ${
        block.className ||
        ""
      }`}
    >
      <tbody>
        {block.rows.map(
          (
            row,
            rowIndex
          ) => (
            <tr
              key={`${block.id}-row-${rowIndex}`}
            >
              {row.map(
                (
                  cell,
                  cellIndex
                ) => {
                  const html =
                    resolveDynamicFields(
                      cell.html,
                      data,
                      editMode
                    );

                  return (
                    <td
                      key={`${block.id}-${rowIndex}-${cellIndex}`}
                      className={
                        cell.divider
                          ? "divider-cell"
                          : ""
                      }
                    >
                      <div
                        className={`editable-table-cell ${
                          editMode &&
                          !cell.divider
                            ? "is-editable"
                            : ""
                        }`}
                        contentEditable={
                          editMode &&
                          !cell.divider
                        }
                        suppressContentEditableWarning
                        spellCheck={
                          editMode
                        }
                        dangerouslySetInnerHTML={{
                          __html:
                            html,
                        }}
                        onFocus={(
                          event
                        ) => {
                          if (
                            !editMode ||
                            cell.divider
                          ) {
                            return;
                          }

                          onSelect(
                            block.id,
                            event.currentTarget
                          );

                          registerEditable(
                            event.currentTarget
                          );
                        }}
                        onMouseUp={(
                          event
                        ) => {
                          if (
                            !editMode ||
                            cell.divider
                          ) {
                            return;
                          }

                          registerEditable(
                            event.currentTarget
                          );
                        }}
                        onKeyUp={(
                          event
                        ) => {
                          if (
                            !editMode ||
                            cell.divider
                          ) {
                            return;
                          }

                          registerEditable(
                            event.currentTarget
                          );
                        }}
                        onBlur={(
                          event
                        ) => {
                          if (
                            !editMode ||
                            cell.divider
                          ) {
                            return;
                          }

                          onCellChange(
                            block.id,
                            rowIndex,
                            cellIndex,
                            event
                              .currentTarget
                              .innerHTML
                          );
                        }}
                      />
                    </td>
                  );
                }
              )}
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
);

const PageHeader = ({
  logoUrl,
}) => (
  <div className="page-header">
    <img
      src={
        logoUrl ||
        DEFAULT_LOGO_URL
      }
      alt="Taproot Solutions Inc."
    />
  </div>
);

const PageFooter = ({
  footerText,
}) => (
  <div className="page-footer">
    {footerText}
  </div>
);

const DocumentPage = ({
  page,

  displayPageNumber,

  editMode,

  data,

  logoUrl,
  footerText,

  selectedBlockId,

  registerEditable,

  onSelectBlock,

  onHtmlChange,
  onTableCellChange,

  onOverflow,
}) => {
  const bodyRef =
    useRef(null);

  useLayoutEffect(() => {
    const body =
      bodyRef.current;

    if (!body) {
      return undefined;
    }

    const check =
      () => {
        const overflowing =
          body.scrollHeight >
          body.clientHeight +
            2;

        onOverflow?.(
          page.id,
          overflowing
        );
      };

    check();

    const observer =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(
            check
          )
        : null;

    observer?.observe(
      body
    );

    window.addEventListener(
      "resize",
      check
    );

    return () => {
      observer?.disconnect();

      window.removeEventListener(
        "resize",
        check
      );
    };
  }, [
    page,
    editMode,
    data,
    onOverflow,
  ]);

  return (
    <section
      className="a4-page"
      data-page-id={
        page.id
      }
      data-document-part={
        page.part
      }
    >
      <PageHeader
        logoUrl={
          logoUrl
        }
      />

      {displayPageNumber && (
        <div className="page-debug-badge no-print">
          Page{" "}
          {
            displayPageNumber
          }
        </div>
      )}

      <div
        ref={bodyRef}
        className="page-body"
      >
        {page.blocks.map(
          (block) => {
            if (
              block.type ===
              "table"
            ) {
              return (
                <EditableTable
                  key={
                    block.id
                  }
                  block={
                    block
                  }
                  editMode={
                    editMode
                  }
                  data={
                    data
                  }
                  selectedBlockId={
                    selectedBlockId
                  }
                  registerEditable={
                    registerEditable
                  }
                  onSelect={
                    onSelectBlock
                  }
                  onCellChange={
                    onTableCellChange
                  }
                />
              );
            }

            return (
              <EditableHtml
                key={
                  block.id
                }
                html={
                  block.html
                }
                editMode={
                  editMode
                }
                data={
                  data
                }
                blockId={
                  block.id
                }
                selected={
                  selectedBlockId ===
                  block.id
                }
                registerEditable={
                  registerEditable
                }
                onSelect={
                  onSelectBlock
                }
                onChange={
                  onHtmlChange
                }
              />
            );
          }
        )}
      </div>

      <PageFooter
        footerText={
          footerText
        }
      />
    </section>
  );
};

export const MSATemplatePages = ({
  template,

  editMode,

  selectedBlockId,

  registerEditable,

  onSelectBlock,

  onHtmlChange,

  onTableCellChange,

  onOverflowChange,
}) => {
  const {
    styleConfig,
    documentData,

    logoUrl,
    footerText,

    packageMode,

    showPageNumbers,

    pages,
  } = template;

  const customStyle = {
    "--doc-margin-top":
      `${styleConfig.marginTop}mm`,

    "--doc-margin-bottom":
      `${styleConfig.marginBottom}mm`,

    "--doc-margin-left":
      `${styleConfig.marginLeft}mm`,

    "--doc-margin-right":
      `${styleConfig.marginRight}mm`,

    "--doc-font-family":
      styleConfig.fontFamily,

    "--doc-font-size":
      `${styleConfig.fontSize}pt`,

    "--doc-line-height":
      styleConfig.lineHeight,

    "--doc-title-size":
      `${styleConfig.titleSize}pt`,

    "--doc-section-title-size":
      `${styleConfig.sectionTitleSize}pt`,

    "--doc-footer-font-size":
      `${styleConfig.footerFontSize}pt`,

    "--doc-footer-rule-color":
      styleConfig.footerRuleColor,

    "--doc-footer-rule-width":
      `${styleConfig.footerRuleWidth}mm`,

    "--doc-logo-width":
      `${styleConfig.logoWidth}mm`,
  };

  const visiblePages =
    pages.filter(
      (page) => {
        if (
          packageMode ===
          "MSA"
        ) {
          return (
            page.part ===
            "MSA"
          );
        }

        if (
          packageMode ===
          "WO"
        ) {
          return (
            page.part ===
            "WO"
          );
        }

        return true;
      }
    );

  return (
    <div
      className={`document-pages-shell ${
        editMode
          ? "document-edit-mode"
          : ""
      }`}
      style={
        customStyle
      }
    >
      {visiblePages.map(
        (
          page,
          index
        ) => (
          <DocumentPage
            key={
              page.id
            }
            page={
              page
            }
            displayPageNumber={
              showPageNumbers
                ? index +
                  1
                : null
            }
            editMode={
              editMode
            }
            data={
              documentData
            }
            logoUrl={
              logoUrl
            }
            footerText={
              footerText
            }
            selectedBlockId={
              selectedBlockId
            }
            registerEditable={
              registerEditable
            }
            onSelectBlock={
              onSelectBlock
            }
            onHtmlChange={
              onHtmlChange
            }
            onTableCellChange={
              onTableCellChange
            }
            onOverflow={
              onOverflowChange
            }
          />
        )
      )}
    </div>
  );
};

export default MSATemplatePages;