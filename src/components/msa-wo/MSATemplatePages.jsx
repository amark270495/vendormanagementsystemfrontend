// src/components/msa-wo/MSATemplatePages.jsx

import React, {
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import "./MSADocumentStyles.css";

import {
  createDefaultTemplate,
  DEFAULT_LOGO_URL,
  resolveDynamicFields,
} from "./MSATemplateDefinition";

/**
 * ============================================================
 * NORMALIZE TEMPLATE
 * ============================================================
 *
 * New API:
 *
 * <MSATemplatePages
 *   template={template}
 *   editMode={false}
 * />
 *
 * Legacy compatibility:
 *
 * <MSATemplatePages
 *   data={data}
 *   margins={{
 *      top: 25.4,
 *      bottom: 25.4,
 *      left: 25.4,
 *      right: 25.4
 *   }}
 * />
 *
 * This compatibility layer prevents older VMS pages from
 * crashing while we migrate everything to the new template API.
 */
const normalizeTemplate = ({
  template,
  data,
  margins,
}) => {
  const defaults =
    createDefaultTemplate();

  /**
   * If a full template was supplied,
   * merge it safely with defaults.
   */
  if (template) {
    return {
      ...defaults,
      ...template,

      styleConfig: {
        ...defaults.styleConfig,
        ...(template.styleConfig || {}),
      },

      documentData: {
        ...defaults.documentData,
        ...(template.documentData || {}),
      },

      pages:
        Array.isArray(template.pages) &&
        template.pages.length > 0
          ? template.pages
          : defaults.pages,

      logoUrl:
        template.logoUrl ||
        defaults.logoUrl,

      footerText:
        template.footerText ??
        defaults.footerText,

      packageMode:
        template.packageMode ||
        defaults.packageMode,

      showPageNumbers:
        Boolean(
          template.showPageNumbers
        ),
    };
  }

  /**
   * Legacy API compatibility.
   */
  return {
    ...defaults,

    documentData: {
      ...defaults.documentData,
      ...(data || {}),
    },

    styleConfig: {
      ...defaults.styleConfig,

      marginTop:
        margins?.top ??
        defaults.styleConfig
          .marginTop,

      marginBottom:
        margins?.bottom ??
        defaults.styleConfig
          .marginBottom,

      marginLeft:
        margins?.left ??
        defaults.styleConfig
          .marginLeft,

      marginRight:
        margins?.right ??
        defaults.styleConfig
          .marginRight,
    },
  };
};

/**
 * ============================================================
 * EDITABLE HTML BLOCK
 * ============================================================
 */
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
  const elementRef =
    useRef(null);

  /**
   * In Edit mode:
   * keep protected VMS field chips.
   *
   * In Preview/PDF mode:
   * resolve fields to real values.
   */
  const renderedHtml =
    useMemo(
      () =>
        resolveDynamicFields(
          html || "",
          data || {},
          editMode
        ),
      [
        html,
        data,
        editMode,
      ]
    );

  const activateEditor =
    () => {
      if (
        !editMode ||
        !elementRef.current
      ) {
        return;
      }

      onSelect?.(
        blockId,
        elementRef.current
      );

      registerEditable?.(
        elementRef.current
      );
    };

  return (
    <div
      ref={elementRef}
      data-block-id={
        blockId
      }
      className={[
        "editable-block",

        editMode
          ? "is-editable"
          : "",

        selected
          ? "is-selected"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
        activateEditor
      }
      onClick={
        activateEditor
      }
      onMouseUp={
        activateEditor
      }
      onKeyUp={
        activateEditor
      }
      onInput={(
        event
      ) => {
        if (!editMode) {
          return;
        }

        registerEditable?.(
          event.currentTarget
        );
      }}
      onBlur={(
        event
      ) => {
        if (!editMode) {
          return;
        }

        onChange?.(
          blockId,
          event.currentTarget
            .innerHTML
        );
      }}
    />
  );
};

/**
 * ============================================================
 * EDITABLE TABLE BLOCK
 * ============================================================
 */
const EditableTable = ({
  block,
  editMode,
  data,

  selectedBlockId,

  registerEditable,

  onSelect,
  onCellChange,
}) => {
  const rows =
    Array.isArray(block.rows)
      ? block.rows
      : [];

  return (
    <div
      data-block-id={
        block.id
      }
      className={[
        "editable-block",
        "table-block",

        selectedBlockId ===
        block.id
          ? "is-selected"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        if (!editMode) {
          return;
        }

        onSelect?.(
          block.id,
          null
        );
      }}
    >
      <table
        className={[
          "doc-table",
          block.className || "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <tbody>
          {rows.map(
            (
              row,
              rowIndex
            ) => (
              <tr
                key={`${block.id}-row-${rowIndex}`}
              >
                {row.map(
                  (
                    tableCell,
                    cellIndex
                  ) => {
                    const isDivider =
                      Boolean(
                        tableCell.divider
                      );

                    const renderedHtml =
                      resolveDynamicFields(
                        tableCell.html ||
                          "",
                        data || {},
                        editMode
                      );

                    const activateCell =
                      (
                        event
                      ) => {
                        if (
                          !editMode ||
                          isDivider
                        ) {
                          return;
                        }

                        event.stopPropagation();

                        onSelect?.(
                          block.id,
                          event.currentTarget
                        );

                        registerEditable?.(
                          event.currentTarget
                        );
                      };

                    return (
                      <td
                        key={`${block.id}-${rowIndex}-${cellIndex}`}
                        className={
                          isDivider
                            ? "divider-cell"
                            : ""
                        }
                      >
                        <div
                          data-table-block-id={
                            block.id
                          }
                          data-row-index={
                            rowIndex
                          }
                          data-cell-index={
                            cellIndex
                          }
                          className={[
                            "editable-table-cell",

                            editMode &&
                            !isDivider
                              ? "is-editable"
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )}
                          contentEditable={
                            editMode &&
                            !isDivider
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
                            activateCell
                          }
                          onClick={
                            activateCell
                          }
                          onMouseUp={
                            activateCell
                          }
                          onKeyUp={(
                            event
                          ) => {
                            if (
                              !editMode ||
                              isDivider
                            ) {
                              return;
                            }

                            registerEditable?.(
                              event.currentTarget
                            );
                          }}
                          onInput={(
                            event
                          ) => {
                            if (
                              !editMode ||
                              isDivider
                            ) {
                              return;
                            }

                            registerEditable?.(
                              event.currentTarget
                            );
                          }}
                          onBlur={(
                            event
                          ) => {
                            if (
                              !editMode ||
                              isDivider
                            ) {
                              return;
                            }

                            onCellChange?.(
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
};

/**
 * ============================================================
 * PAGE HEADER
 * ============================================================
 */
const PageHeader = ({
  logoUrl,
}) => (
  <div className="page-header">
    <img
      src={
        logoUrl ||
        DEFAULT_LOGO_URL
      }
      crossOrigin="anonymous"
      alt="Taproot Solutions Inc."
      draggable={false}
    />
  </div>
);

/**
 * ============================================================
 * PAGE FOOTER
 * ============================================================
 */
const PageFooter = ({
  footerText,
}) => (
  <div className="page-footer">
    {footerText}
  </div>
);

/**
 * ============================================================
 * ONE PHYSICAL A4 PAGE
 * ============================================================
 */
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

  /**
   * Detect page overflow.
   *
   * This is important because we intentionally use
   * fixed physical A4 pages.
   */
  useLayoutEffect(() => {
    const body =
      bodyRef.current;

    if (!body) {
      return undefined;
    }

    let animationFrame;

    const checkOverflow =
      () => {
        cancelAnimationFrame(
          animationFrame
        );

        animationFrame =
          requestAnimationFrame(
            () => {
              if (!body) {
                return;
              }

              const overflowing =
                body.scrollHeight >
                body.clientHeight +
                  2;

              onOverflow?.(
                page.id,
                overflowing
              );
            }
          );
      };

    checkOverflow();

    const resizeObserver =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(
            checkOverflow
          )
        : null;

    resizeObserver?.observe(
      body
    );

    window.addEventListener(
      "resize",
      checkOverflow
    );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      resizeObserver?.disconnect();

      window.removeEventListener(
        "resize",
        checkOverflow
      );
    };
  }, [
    page,
    editMode,
    data,
    onOverflow,
  ]);

  const blocks =
    Array.isArray(page.blocks)
      ? page.blocks
      : [];

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
        {blocks.map(
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
                  block.html ||
                  ""
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

/**
 * ============================================================
 * MAIN DOCUMENT COMPONENT
 * ============================================================
 */
export const MSATemplatePages = ({
  /**
   * New API
   */
  template,

  /**
   * Legacy API fallback
   */
  data,
  margins,

  /**
   * WYSIWYG mode
   */
  editMode = false,

  selectedBlockId = null,

  registerEditable = () => {},

  onSelectBlock = () => {},

  onHtmlChange = () => {},

  onTableCellChange = () => {},

  onOverflowChange = () => {},
}) => {
  /**
   * Always produce a complete valid template,
   * even if an old caller provides only data/margins.
   */
  const safeTemplate =
    useMemo(
      () =>
        normalizeTemplate({
          template,
          data,
          margins,
        }),
      [
        template,
        data,
        margins,
      ]
    );

  const {
    styleConfig,
    documentData,

    logoUrl,
    footerText,

    packageMode,

    showPageNumbers,

    pages,
  } = safeTemplate;

  /**
   * Apply saved style configuration through CSS variables.
   */
  const customStyle =
    useMemo(
      () => ({
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
      }),
      [
        styleConfig,
      ]
    );

  /**
   * Filter physical pages according to package selection.
   */
  const visiblePages =
    useMemo(() => {
      const sourcePages =
        Array.isArray(pages)
          ? pages
          : [];

      return sourcePages.filter(
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

          /**
           * MSA_WO
           */
          return true;
        }
      );
    }, [
      pages,
      packageMode,
    ]);

  return (
    <div
      className={[
        "document-pages-shell",

        editMode
          ? "document-edit-mode"
          : "document-preview-mode",
      ]
        .filter(Boolean)
        .join(" ")}
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
                ? index + 1
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