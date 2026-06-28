(function () {
  // make login and other ttrss_utility pages mobile-friendly (needs local-overrides.css)
  var meta = document.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1.0";
  document.querySelector("head").appendChild(meta);

  // polyfill for Safari, from https://github.com/pladaria/requestidlecallback-polyfill/blob/master/index.js
  window.requestIdleCallback =
    window.requestIdleCallback ||
    function (cb) {
      var start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };

  window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function (id) {
      clearTimeout(id);
    };

  // ---------------------------------------------------------------------------
  // Category Controls for Feedly Theme
  // ---------------------------------------------------------------------------
  (function () {
    "use strict";

    var CATEGORY_CONTROLS_KEY = "feedly-category-view-";

    var viewModes = [
      { id: "magazine", label: "Magazine", icon: "view_agenda" },
      { id: "cards", label: "Cards", icon: "view_module" },
      { id: "article", label: "Article View", icon: "view_stream" },
      { id: "title", label: "Title", icon: "format_list_bulleted" },
    ];

    function getStoredView(categoryId) {
      try {
        var stored = localStorage.getItem(CATEGORY_CONTROLS_KEY + categoryId);
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }

    function setStoredView(categoryId, viewId) {
      try {
        localStorage.setItem(CATEGORY_CONTROLS_KEY + categoryId, JSON.stringify({ view: viewId }));
      } catch (e) {
        // localStorage not available
      }
    }

    function createControlsHtml() {
      var html = '<div class="category-controls">';
      html += '<button class="category-btn mark-read-btn" title="Mark all as read" aria-label="Mark all as read"></button>';
      html += '<button class="category-btn refresh-btn" title="Refresh feeds" aria-label="Refresh feeds"></button>';
      html += '<button class="category-btn menu-btn" title="View options" aria-label="View options">•••</button>';
      html += '</div>';
      return html;
    }

    function createDropdownHtml(categoryId) {
      var html = '<div class="category-dropdown" role="menu" aria-label="View options">';
      viewModes.forEach(function (mode) {
        html += '<button class="dropdown-item" data-view="' + mode.id + '" role="menuitem">';
        html += '<i class="material-icons">' + mode.icon + '</i>';
        html += '<span>' + mode.label + '</span>';
        html += '</button>';
      });
      html += '</div>';
      return html;
    }

    function getCategoryId(row) {
      var parent = row.closest(".dijitTreeNode");
      if (!parent) return null;
      var parentRow = parent.previousElementSibling;
      if (!parentRow || !parentRow.classList.contains("dijitTreeRow")) return null;
      var label = parentRow.querySelector(".dijitTreeLabel");
      return label ? label.getAttribute("id") || label.textContent.trim() : null;
    }

    function isCategoryRow(row) {
      return row.classList.contains("dijitTreeRowSelected") && row.querySelector(".dijitTreeExpandoOpened") !== null;
    }

    function initCategoryControls() {
      var feedsHolder = document.getElementById("feeds-holder");
      if (!feedsHolder) return;

      var treeRows = feedsHolder.querySelectorAll(".dijitTreeRow");
      treeRows.forEach(function (row) {
        if (row.querySelector(".category-controls")) return;
        if (!isCategoryRow(row)) return;

        var controlsContainer = document.createElement("div");
        controlsContainer.innerHTML = createControlsHtml();
        var controls = controlsContainer.firstElementChild;
        row.appendChild(controls);

        var markReadBtn = controls.querySelector(".mark-read-btn");
        var refreshBtn = controls.querySelector(".refresh-btn");
        var menuBtn = controls.querySelector(".menu-btn");

        markReadBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var categoryId = getCategoryId(row);
          if (categoryId && typeof quickAddFeed === "function") {
            quickAddFeed("markfeed:" + categoryId + ":read");
          } else if (typeof view.setFeed === "function") {
            view.setFeed(categoryId, "markfeed:" + categoryId + ":read");
          }
          document.dispatchEvent(new CustomEvent("ttrss-category-mark-read", { detail: { categoryId: categoryId } }));
        });

        refreshBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var categoryId = getCategoryId(row);
          if (categoryId && typeof quickAddFeed === "function") {
            quickAddFeed("refreshfeed:" + categoryId);
          } else if (typeof view.refresh === "function") {
            view.refresh();
          }
          document.dispatchEvent(new CustomEvent("ttrss-category-refresh", { detail: { categoryId: categoryId } }));
        });

        menuBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var dropdown = row.querySelector(".category-dropdown");
          if (dropdown) {
            closeAllDropdowns();
            dropdown.remove();
            menuBtn.classList.remove("menu-open");
            return;
          }
          closeAllDropdowns();
          var dropdownHtml = createDropdownHtml(categoryId);
          menuBtn.parentElement.insertAdjacentHTML("beforeend", dropdownHtml);
          dropdown = row.querySelector(".category-dropdown");
          menuBtn.classList.add("menu-open");

          var categoryId = getCategoryId(row);
          var currentView = getStoredView(categoryId);

          dropdown.querySelectorAll(".dropdown-item").forEach(function (item) {
            if (currentView && item.getAttribute("data-view") === currentView.view) {
              item.classList.add("active");
            }
          });

          dropdown.querySelectorAll(".dropdown-item").forEach(function (item) {
            item.addEventListener("click", function (e) {
              e.stopPropagation();
              var viewId = item.getAttribute("data-view");
              setStoredView(categoryId, viewId);
              applyViewMode(viewId, categoryId);
              closeAllDropdowns();
            });
          });
        });
      });
    }

    function closeAllDropdowns() {
      document.querySelectorAll(".category-dropdown").forEach(function (d) { d.remove(); });
      document.querySelectorAll(".category-btn.menu-open").forEach(function (b) { b.classList.remove("menu-open"); });
    }

    function applyViewMode(viewId, categoryId) {
      var view = view || window.view;
      var modes = {
        "magazine": { viewMode: "magazine", cdmMode: "full" },
        "cards": { viewMode: "cards", cdmMode: "expanded" },
        "article": { viewMode: "list", cdmMode: "full" },
        "title": { viewMode: "list", cdmMode: "unexpanded" }
      };

      if (modes[viewId]) {
        if (view && typeof view.setViewMode === "function") {
          view.setViewMode(modes[viewId].viewMode);
        }
        if (view && typeof view.setCdmMode === "function") {
          view.setCdmMode(modes[viewId].cdmMode);
        }
      }

      document.querySelectorAll(".category-dropdown").forEach(function (d) {
        d.querySelectorAll(".dropdown-item").forEach(function (item) {
          item.classList.toggle("active", item.getAttribute("data-view") === viewId);
        });
      });

      document.dispatchEvent(new CustomEvent("ttrss-category-view-change", {
        detail: { categoryId: categoryId, viewId: viewId }
      }));
    }

    function initObserver() {
      var observer = new MutationObserver(function (mutations) {
        var shouldInit = false;
        mutations.forEach(function (mutation) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType === 1) {
                if (node.classList && (node.classList.contains("dijitTreeRow") || node.classList.contains("dijitTreeNode"))) {
                  shouldInit = true;
                }
                if (node.querySelector && node.querySelector(".dijitTreeRow")) {
                  shouldInit = true;
                }
              }
            });
          }
        });
        if (shouldInit) {
          initCategoryControls();
        }
      });

      var feedsHolder = document.getElementById("feeds-holder");
      if (feedsHolder) {
        observer.observe(feedsHolder, { childList: true, subtree: true });
      }
    }

    function init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          initCategoryControls();
          initObserver();
        });
      } else {
        initCategoryControls();
        initObserver();
      }

      document.addEventListener("click", function (e) {
        if (!e.target.closest(".category-dropdown") && !e.target.closest(".menu-btn")) {
          closeAllDropdowns();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeAllDropdowns();
        }
      });
    }

    init();
  })();
})();
