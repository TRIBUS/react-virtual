import React__default, { useState } from 'react';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var props = ['bottom', 'height', 'left', 'right', 'top', 'width'];

var rectChanged = function rectChanged(a, b) {
  if (a === void 0) {
    a = {};
  }

  if (b === void 0) {
    b = {};
  }

  return props.some(function (prop) {
    return a[prop] !== b[prop];
  });
};

var observedNodes = /*#__PURE__*/new Map();
var rafId;

var run = function run() {
  var changedStates = [];
  observedNodes.forEach(function (state, node) {
    var newRect = node.getBoundingClientRect();

    if (rectChanged(newRect, state.rect)) {
      state.rect = newRect;
      changedStates.push(state);
    }
  });
  changedStates.forEach(function (state) {
    state.callbacks.forEach(function (cb) {
      return cb(state.rect);
    });
  });
  rafId = window.requestAnimationFrame(run);
};

function observeRect(node, cb) {
  return {
    observe: function observe() {
      var wasEmpty = observedNodes.size === 0;

      if (observedNodes.has(node)) {
        observedNodes.get(node).callbacks.push(cb);
      } else {
        observedNodes.set(node, {
          rect: undefined,
          hasRectChanged: false,
          callbacks: [cb]
        });
      }

      if (wasEmpty) run();
    },
    unobserve: function unobserve() {
      var state = observedNodes.get(node);

      if (state) {
        // Remove the callback
        var index = state.callbacks.indexOf(cb);
        if (index >= 0) state.callbacks.splice(index, 1); // Remove the node reference

        if (!state.callbacks.length) observedNodes["delete"](node); // Stop the loop

        if (!observedNodes.size) cancelAnimationFrame(rafId);
      }
    }
  };
}

var useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React__default.useLayoutEffect : React__default.useEffect;

function useRect(nodeRef) {
  var _React$useState = React__default.useState(nodeRef.current),
      element = _React$useState[0],
      setElement = _React$useState[1];

  var _React$useReducer = React__default.useReducer(rectReducer, null),
      rect = _React$useReducer[0],
      dispatch = _React$useReducer[1];

  var initialRectSet = React__default.useRef(false);
  useIsomorphicLayoutEffect(function () {
    if (nodeRef.current !== element) {
      setElement(nodeRef.current);
    }
  });
  useIsomorphicLayoutEffect(function () {
    if (element && !initialRectSet.current) {
      initialRectSet.current = true;

      var _rect = element.getBoundingClientRect();

      dispatch({
        rect: _rect
      });
    }
  }, [element]);
  React__default.useEffect(function () {
    if (!element) {
      return;
    }

    var observer = observeRect(element, function (rect) {
      dispatch({
        rect: rect
      });
    });
    observer.observe();
    return function () {
      observer.unobserve();
    };
  }, [element]);
  return rect;
}

function rectReducer(state, action) {
  var rect = action.rect;

  if (!state || state.height !== rect.height || state.width !== rect.width) {
    return rect;
  }

  return state;
}

function useWindowRect(windowRef) {
  var _React$useState = useState({
    height: undefined,
    width: undefined
  }),
      rect = _React$useState[0],
      setRect = _React$useState[1];

  var element = windowRef.current;
  useIsomorphicLayoutEffect(function () {
    var resizeHandler = function resizeHandler() {
      var next = {
        height: element.innerHeight,
        width: element.innerWidth
      };
      setRect(function (prev) {
        return prev.height !== next.height || prev.width !== next.width ? next : prev;
      });
    };

    resizeHandler();
    element.addEventListener('resize', resizeHandler);
    return function () {
      element.removeEventListener('resize', resizeHandler);
    };
  }, [element]);
  return rect;
}

var defaultEstimateSize = function defaultEstimateSize() {
  return 50;
};

var defaultKeyExtractor = function defaultKeyExtractor(index) {
  return index;
};

var defaultMeasureSize = function defaultMeasureSize(el, horizontal) {
  var key = horizontal ? 'offsetWidth' : 'offsetHeight';
  return el[key];
};

var defaultRangeExtractor = function defaultRangeExtractor(range) {
  var start = Math.max(range.start - range.overscan, 0);
  var end = Math.min(range.end + range.overscan, range.size - 1);
  var arr = [];

  for (var i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
};
function useVirtualWindow(_ref) {
  var windowRef = _ref.windowRef,
      scrollToFn = _ref.scrollToFn,
      horizontal = _ref.horizontal,
      parentRef = _ref.parentRef,
      rest = _objectWithoutPropertiesLoose(_ref, ["windowRef", "scrollToFn", "horizontal", "parentRef"]);

  var scrollKey = horizontal ? 'scrollX' : 'scrollY';
  var defaultScrollToFn = React__default.useCallback(function (offset) {
    if (windowRef.current) {
      windowRef.current[scrollKey] = offset;
    }
  }, [scrollKey, windowRef]);
  return useVirtual(_extends(_extends({}, rest), {}, {
    horizontal: horizontal,
    parentRef: parentRef,
    scrollToFn: scrollToFn || defaultScrollToFn,
    onScrollElement: windowRef,
    scrollOffsetFn: function scrollOffsetFn() {
      var bounds = parentRef.current.getBoundingClientRect();
      return horizontal ? bounds.left * -1 : bounds.top * -1;
    },
    useObserver: function useObserver() {
      return useWindowRect(windowRef);
    }
  }));
}
function useVirtual(_ref2) {
  var _ref4, _measurements;

  var _ref2$size = _ref2.size,
      size = _ref2$size === void 0 ? 0 : _ref2$size,
      _ref2$estimateSize = _ref2.estimateSize,
      estimateSize = _ref2$estimateSize === void 0 ? defaultEstimateSize : _ref2$estimateSize,
      _ref2$overscan = _ref2.overscan,
      overscan = _ref2$overscan === void 0 ? 1 : _ref2$overscan,
      _ref2$paddingStart = _ref2.paddingStart,
      paddingStart = _ref2$paddingStart === void 0 ? 0 : _ref2$paddingStart,
      _ref2$paddingEnd = _ref2.paddingEnd,
      paddingEnd = _ref2$paddingEnd === void 0 ? 0 : _ref2$paddingEnd,
      parentRef = _ref2.parentRef,
      horizontal = _ref2.horizontal,
      scrollToFn = _ref2.scrollToFn,
      useObserver = _ref2.useObserver,
      onScrollElement = _ref2.onScrollElement,
      scrollOffsetFn = _ref2.scrollOffsetFn,
      _ref2$keyExtractor = _ref2.keyExtractor,
      keyExtractor = _ref2$keyExtractor === void 0 ? defaultKeyExtractor : _ref2$keyExtractor,
      _ref2$measureSize = _ref2.measureSize,
      measureSize = _ref2$measureSize === void 0 ? defaultMeasureSize : _ref2$measureSize,
      _ref2$rangeExtractor = _ref2.rangeExtractor,
      rangeExtractor = _ref2$rangeExtractor === void 0 ? defaultRangeExtractor : _ref2$rangeExtractor;
  var sizeKey = horizontal ? 'width' : 'height';
  var scrollKey = horizontal ? 'scrollLeft' : 'scrollTop';
  var latestRef = React__default.useRef({
    scrollOffset: 0,
    measurements: []
  });
  var useMeasureParent = useObserver || useRect;

  var _ref3 = useMeasureParent(parentRef) || (_ref4 = {}, _ref4[sizeKey] = 0, _ref4),
      outerSize = _ref3[sizeKey];

  latestRef.current.outerSize = outerSize;
  var defaultScrollToFn = React__default.useCallback(function (offset) {
    if (parentRef.current) {
      parentRef.current[scrollKey] = offset;
    }
  }, [parentRef, scrollKey]);
  var resolvedScrollToFn = scrollToFn || defaultScrollToFn;
  scrollToFn = React__default.useCallback(function (offset) {
    resolvedScrollToFn(offset, defaultScrollToFn);
  }, [defaultScrollToFn, resolvedScrollToFn]);

  var _React$useState = React__default.useState({}),
      measuredCache = _React$useState[0],
      setMeasuredCache = _React$useState[1];

  var measure = React__default.useCallback(function () {
    return setMeasuredCache({});
  }, []);
  var pendingMeasuredCacheIndexesRef = React__default.useRef([]);
  var measurements = React__default.useMemo(function () {
    var min = pendingMeasuredCacheIndexesRef.current.length > 0 ? Math.min.apply(Math, pendingMeasuredCacheIndexesRef.current) : 0;
    pendingMeasuredCacheIndexesRef.current = [];
    var measurements = latestRef.current.measurements.slice(0, min);

    for (var i = min; i < size; i++) {
      var key = keyExtractor(i);
      var measuredSize = measuredCache[key];
      var start = measurements[i - 1] ? measurements[i - 1].end : paddingStart;

      var _size = typeof measuredSize === 'number' ? measuredSize : estimateSize(i);

      var end = start + _size;
      measurements[i] = {
        index: i,
        start: start,
        size: _size,
        end: end,
        key: key
      };
    }

    return measurements;
  }, [estimateSize, measuredCache, paddingStart, size, keyExtractor]);
  var totalSize = (((_measurements = measurements[size - 1]) == null ? void 0 : _measurements.end) || 0) + paddingEnd;
  latestRef.current.measurements = measurements;
  latestRef.current.totalSize = totalSize;

  var _React$useState2 = React__default.useState({
    start: 0,
    end: 0
  }),
      range = _React$useState2[0],
      setRange = _React$useState2[1];

  var element = onScrollElement ? onScrollElement.current : parentRef.current;
  var scrollOffsetFnRef = React__default.useRef(scrollOffsetFn);
  scrollOffsetFnRef.current = scrollOffsetFn;
  var rangeTimeoutIdRef = React__default.useRef(null);
  var cancelAsyncRange = React__default.useCallback(function () {
    if (rangeTimeoutIdRef.current !== null) {
      clearTimeout(rangeTimeoutIdRef.current);
      rangeTimeoutIdRef.current = null;
    }
  }, []);
  useIsomorphicLayoutEffect(function () {
    rangeTimeoutIdRef.current = setTimeout(function () {
      setRange(function (prevRange) {
        return calculateRange(latestRef.current, prevRange);
      });
    });
    return function () {
      return cancelAsyncRange();
    };
  }, [measurements, outerSize, cancelAsyncRange]);
  useIsomorphicLayoutEffect(function () {
    if (!element) {
      setRange({
        start: 0,
        end: 0
      });
      latestRef.current.scrollOffset = 0;
      return;
    }

    var onScroll = function onScroll(event) {
      var scrollOffset = scrollOffsetFnRef.current ? scrollOffsetFnRef.current(event) : element[scrollKey];
      latestRef.current.scrollOffset = scrollOffset;
      cancelAsyncRange();
      setRange(function (prevRange) {
        return calculateRange(latestRef.current, prevRange);
      });
    }; // Determine initially visible range


    onScroll();
    element.addEventListener('scroll', onScroll, {
      capture: false,
      passive: true
    });
    return function () {
      element.removeEventListener('scroll', onScroll);
    };
  }, [element, scrollKey, cancelAsyncRange]);
  var measureSizeRef = React__default.useRef(measureSize);
  measureSizeRef.current = measureSize;
  var virtualItems = React__default.useMemo(function () {
    var indexes = rangeExtractor({
      start: range.start,
      end: range.end,
      overscan: overscan,
      size: measurements.length
    });
    var virtualItems = [];

    var _loop = function _loop(k, len) {
      var i = indexes[k];
      var measurement = measurements[i];

      var item = _extends(_extends({}, measurement), {}, {
        measureRef: function measureRef(el) {
          if (el) {
            var measuredSize = measureSizeRef.current(el, horizontal);

            if (measuredSize !== item.size) {
              var scrollOffset = latestRef.current.scrollOffset;

              if (item.start < scrollOffset) {
                defaultScrollToFn(scrollOffset + (measuredSize - item.size));
              }

              pendingMeasuredCacheIndexesRef.current.push(i);
              setMeasuredCache(function (old) {
                var _extends2;

                return _extends(_extends({}, old), {}, (_extends2 = {}, _extends2[item.key] = measuredSize, _extends2));
              });
            }
          }
        }
      });

      virtualItems.push(item);
    };

    for (var k = 0, len = indexes.length; k < len; k++) {
      _loop(k);
    }

    return virtualItems;
  }, [defaultScrollToFn, horizontal, measurements, overscan, range.end, range.start, rangeExtractor]);
  var mountedRef = React__default.useRef();
  useIsomorphicLayoutEffect(function () {
    if (mountedRef.current) {
      if (estimateSize) setMeasuredCache({});
    }

    mountedRef.current = true;
  }, [estimateSize]);
  var scrollToOffset = React__default.useCallback(function (toOffset, _temp) {
    var _ref5 = _temp === void 0 ? {} : _temp,
        _ref5$align = _ref5.align,
        align = _ref5$align === void 0 ? 'start' : _ref5$align;

    var _latestRef$current = latestRef.current,
        scrollOffset = _latestRef$current.scrollOffset,
        outerSize = _latestRef$current.outerSize;

    if (align === 'auto') {
      if (toOffset <= scrollOffset) {
        align = 'start';
      } else if (toOffset >= scrollOffset + outerSize) {
        align = 'end';
      } else {
        align = 'start';
      }
    }

    if (align === 'start') {
      scrollToFn(toOffset);
    } else if (align === 'end') {
      scrollToFn(toOffset - outerSize);
    } else if (align === 'center') {
      scrollToFn(toOffset - outerSize / 2);
    }
  }, [scrollToFn]);
  var tryScrollToIndex = React__default.useCallback(function (index, _temp2) {
    var _ref6 = _temp2 === void 0 ? {} : _temp2,
        _ref6$align = _ref6.align,
        align = _ref6$align === void 0 ? 'auto' : _ref6$align,
        rest = _objectWithoutPropertiesLoose(_ref6, ["align"]);

    var _latestRef$current2 = latestRef.current,
        measurements = _latestRef$current2.measurements,
        scrollOffset = _latestRef$current2.scrollOffset,
        outerSize = _latestRef$current2.outerSize;
    var measurement = measurements[Math.max(0, Math.min(index, size - 1))];

    if (!measurement) {
      return;
    }

    if (align === 'auto') {
      if (measurement.end >= scrollOffset + outerSize) {
        align = 'end';
      } else if (measurement.start <= scrollOffset) {
        align = 'start';
      } else {
        return;
      }
    }

    var toOffset = align === 'center' ? measurement.start + measurement.size / 2 : align === 'end' ? measurement.end : measurement.start;
    scrollToOffset(toOffset, _extends({
      align: align
    }, rest));
  }, [scrollToOffset, size]);
  var scrollToIndex = React__default.useCallback(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // We do a double request here because of
    // dynamic sizes which can cause offset shift
    // and end up in the wrong spot. Unfortunately,
    // we can't know about those dynamic sizes until
    // we try and render them. So double down!
    tryScrollToIndex.apply(void 0, args);
    requestAnimationFrame(function () {
      tryScrollToIndex.apply(void 0, args);
    });
  }, [tryScrollToIndex]);
  return {
    virtualItems: virtualItems,
    totalSize: totalSize,
    scrollToOffset: scrollToOffset,
    scrollToIndex: scrollToIndex,
    measure: measure
  };
}

var findNearestBinarySearch = function findNearestBinarySearch(low, high, getCurrentValue, value) {
  while (low <= high) {
    var middle = (low + high) / 2 | 0;
    var currentValue = getCurrentValue(middle);

    if (currentValue < value) {
      low = middle + 1;
    } else if (currentValue > value) {
      high = middle - 1;
    } else {
      return middle;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
};

function calculateRange(_ref7, prevRange) {
  var measurements = _ref7.measurements,
      outerSize = _ref7.outerSize,
      scrollOffset = _ref7.scrollOffset;
  var size = measurements.length - 1;

  var getOffset = function getOffset(index) {
    return measurements[index].start;
  };

  var start = findNearestBinarySearch(0, size, getOffset, scrollOffset);
  var end = start;

  while (end < size && measurements[end].end < scrollOffset + outerSize) {
    end++;
  }

  if (prevRange.start !== start || prevRange.end !== end) {
    return {
      start: start,
      end: end
    };
  }

  return prevRange;
}

export { defaultRangeExtractor, useVirtual, useVirtualWindow };
//# sourceMappingURL=react-virtual.mjs.map
