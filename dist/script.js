!(function() {
  var today = moment();

  function Calendar(selector, events) {
    this.el = document.querySelector(selector);
    this.events = events;
    this.current = moment().date(1);
    this.draw();
    var current = document.querySelector(".today");
    if (current) {
      var self = this;
      window.setTimeout(function() {
        self.openDay(current);
      }, 500);
    }
    this.drawLegend();
  }

  Calendar.prototype.draw = function() {
    //Create Header
    this.drawHeader();

    //Draw Month
    this.drawMonth();

    //this.drawLegend();
  };

  Calendar.prototype.drawHeader = function() {
    var self = this;
    if (!this.header) {
      //Create the header elements
      this.header = createElement("div", "header");
      this.header.className = "header";

      this.title = createElement("h1");

      var right = createElement("div", "right");
      right.addEventListener("click", function() {
        self.nextMonth();
      });

      var left = createElement("div", "left");
      left.addEventListener("click", function() {
        self.prevMonth();
      });

      //Append the Elements
      this.header.appendChild(this.title);
      this.header.appendChild(right);
      this.header.appendChild(left);
      this.el.appendChild(this.header);
    }

    this.title.innerHTML = this.current.format("MMMM YYYY");
  };

  Calendar.prototype.drawMonth = function() {
    var self = this;

    this.events.forEach(function(ev) {
      ev.date = moment(ev.eventTime, "YYYY-MM-DD hh:mm:ss");
    });

    if (this.month) {
      this.oldMonth = this.month;
      this.oldMonth.className = "month out " + (self.next ? "next" : "prev");
      this.oldMonth.addEventListener("webkitAnimationEnd", function() {
        self.oldMonth.parentNode.removeChild(self.oldMonth);
        self.month = createElement("div", "month");
        self.backFill();
        self.currentMonth();
        self.fowardFill();
        self.el.appendChild(self.month);
        window.setTimeout(function() {
          self.month.className = "month in " + (self.next ? "next" : "prev");
        }, 16);
      });
    } else {
      this.month = createElement("div", "month");
      this.el.appendChild(this.month);
      this.backFill();
      this.currentMonth();
      this.fowardFill();
      this.month.className = "month new";
    }
  };

  Calendar.prototype.backFill = function() {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();

    if (!dayOfWeek) {
      return;
    }

    clone.subtract("days", dayOfWeek + 1);

    for (var i = dayOfWeek; i > 0; i--) {
      this.drawDay(clone.add("days", 1));
    }
  };

  Calendar.prototype.fowardFill = function() {
    var clone = this.current
      .clone()
      .add("months", 1)
      .subtract("days", 1);
    var dayOfWeek = clone.day();

    if (dayOfWeek === 6) {
      return;
    }

    for (var i = dayOfWeek; i < 6; i++) {
      this.drawDay(clone.add("days", 1));
    }
  };

  Calendar.prototype.currentMonth = function() {
    var clone = this.current.clone();

    while (clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add("days", 1);
    }
  };

  Calendar.prototype.getWeek = function(day) {
    if (!this.week || day.day() === 0) {
      this.week = createElement("div", "week");
      this.month.appendChild(this.week);
    }
  };

  Calendar.prototype.drawDay = function(day) {
    var self = this;
    this.getWeek(day);

    //Outer Day
    var outer = createElement("div", this.getDayClass(day));
    outer.addEventListener("click", function() {
      self.openDay(this);
    });

    //Day Name
    var name = createElement("div", "day-name", day.format("ddd"));

    //Day Number
    var number = createElement("div", "day-number", day.format("DD"));

    //Events
    var events = createElement("div", "day-events");
    this.drawEvents(day, events);

    outer.appendChild(name);
    outer.appendChild(number);
    outer.appendChild(events);
    this.week.appendChild(outer);
  };

  Calendar.prototype.drawEvents = function(day, element) {
    if (day.month() === this.current.month()) {
      var todaysEvents = this.events.reduce(function(memo, ev) {
        if (ev.date.isSame(day, "day")) {
          memo.push(ev);
        }
        return memo;
      }, []);

      todaysEvents.forEach(function(ev) {
        var evSpan = createElement("span", ev.color);
        element.appendChild(evSpan);
      });
    }
  };

  Calendar.prototype.getDayClass = function(day) {
    classes = ["day"];
    if (day.month() !== this.current.month()) {
      classes.push("other");
    } else if (today.isSame(day, "day")) {
      classes.push("today");
    }
    return classes.join(" ");
  };

  Calendar.prototype.openDay = function(el) {
    var details, arrow;
    var dayNumber =
      +el.querySelectorAll(".day-number")[0].innerText ||
      +el.querySelectorAll(".day-number")[0].textContent;
    var day = this.current.clone().date(dayNumber);

    var currentOpened = document.querySelector(".details");

    //Check to see if there is an open detais box on the current row
    if (currentOpened && currentOpened.parentNode === el.parentNode) {
      details = currentOpened;
      arrow = document.querySelector(".arrow");
    } else {
      //Close the open events on differnt week row
      //currentOpened && currentOpened.parentNode.removeChild(currentOpened);
      if (currentOpened) {
        currentOpened.addEventListener("webkitAnimationEnd", function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("oanimationend", function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("msAnimationEnd", function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener("animationend", function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.className = "details out";
      }

      //Create the Details Container
      details = createElement("div", "details in");

      //Create the arrow
      var arrow = createElement("div", "arrow");

      //Create the event wrapper

      details.appendChild(arrow);
      el.parentNode.appendChild(details);
    }

    var todaysEvents = this.events.reduce(function(memo, ev) {
      if (ev.date.isSame(day, "day")) {
        memo.push(ev);
      }
      return memo;
    }, []);

    this.renderEvents(todaysEvents, details);

    arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + "px";
  };

  Calendar.prototype.renderEvents = function(events, ele) {
    //Remove any events in the current details element
    var currentWrapper = ele.querySelector(".events");
    var wrapper = createElement(
      "div",
      "events in" + (currentWrapper ? " new" : "")
    );

    events.forEach(function(ev) {
      var div = createElement("div", "event");
      var square = createElement("div", "event-category " + ev.color);
      var span = createElement("span", "", ev.eventName);

      div.appendChild(square);
      div.appendChild(span);
      wrapper.appendChild(div);
    });

    if (!events.length) {
      var div = createElement("div", "event empty");
      var span = createElement("span", "", "No Events");

      div.appendChild(span);
      wrapper.appendChild(div);
    }

    if (currentWrapper) {
      currentWrapper.className = "events out";
      currentWrapper.addEventListener("webkitAnimationEnd", function() {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("oanimationend", function() {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("msAnimationEnd", function() {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
      currentWrapper.addEventListener("animationend", function() {
        currentWrapper.parentNode.removeChild(currentWrapper);
        ele.appendChild(wrapper);
      });
    } else {
      ele.appendChild(wrapper);
    }
  };

  Calendar.prototype.drawLegend = function() {
    var legend = createElement("div", "legend");
    var calendars = this.events
      .map(function(e) {
        return e.calendar + "|" + e.color;
      })
      .reduce(function(memo, e) {
        if (memo.indexOf(e) === -1) {
          memo.push(e);
        }
        return memo;
      }, [])
      .forEach(function(e) {
        var parts = e.split("|");
        var entry = createElement("span", "entry " + parts[1], parts[0]);
        legend.appendChild(entry);
      });
    this.el.appendChild(legend);
  };

  Calendar.prototype.nextMonth = function() {
    this.current.add("months", 1);
    this.next = true;
    this.draw();
  };

  Calendar.prototype.prevMonth = function() {
    this.current.subtract("months", 1);
    this.next = false;
    this.draw();
  };

  window.Calendar = Calendar;

  function createElement(tagName, className, innerText) {
    var ele = document.createElement(tagName);
    if (className) {
      ele.className = className;
    }
    if (innerText) {
      ele.innderText = ele.textContent = innerText;
    }
    return ele;
  }
})();

!(function() {
  var data = [
      {
      eventName: "Мустақиллик байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-9-1 15-15-00"
    },
    {
      eventName: "Мустақиллик байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-9-1 15-15-00"
    },
    {
      eventName: "Мустақиллик байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-9-1 15-15-00"
    },
    {
      eventName: "Мустақиллик байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-9-1 15-15-00"
    },
    {
      eventName: "Мустақиллик байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-9-1 15-15-00"
    },
    {
      eventName: "Наврўз Байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-3-21 15-15-00"
    },
    {
      eventName: "Наврўз Байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-3-21 15-15-00"
    },
    {
      eventName: "Наврўз Байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-3-21 15-15-00"
    },
    {
      eventName: "Наврўз Байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-3-21 15-15-00"
    },
    {
      eventName: "Наврўз Байрами",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-3-21 15-15-00"
    },
    {
      eventName: "Ватан ҳимоячилари куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-1-14 15-15-00"
    },
    {
      eventName: "Ватан ҳимоячилари куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-1-14 15-15-00"
    },
    {
      eventName: "Ватан ҳимоячилари куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-1-14 15-15-00"
    },
    {
      eventName: "Ватан ҳимоячилари куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-1-14 15-15-00"
    },
    {
      eventName: "Ватан ҳимоячилари куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-1-14 15-15-00"
    },
    {
      eventName: "Кониституция куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-12-8 15-15-00"
    },
    {
      eventName: "Кониституция куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-12-8 15-15-00"
    },
    {
      eventName: "Кониституция куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-12-8 15-15-00"
    },
    {
      eventName: "Кониституция куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-12-8 15-15-00"
    },
    {
      eventName: "Кониституция куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-12-8 15-15-00"
    },
    {
      eventName: "Хотира ва қадрлаш куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-5-9 15-15-00"
    },
    {
      eventName: "Хотира ва қадрлаш куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-5-9 15-15-00"
    },
    {
      eventName: "Хотира ва қадрлаш куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-5-9 15-15-00"
    },
    {
      eventName: "Хотира ва қадрлаш куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-5-9 15-15-00"
    },
    {
      eventName: "Хотира ва қадрлаш куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-5-9 15-15-00"
    },
    {
      eventName: "Ўқтувчилар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-10-1 15-15-00"
    },
    {
      eventName: "Ўқтувчилар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-10-1 15-15-00"
    },
    {
      eventName: "Ўқтувчилар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-10-1 15-15-00"
    },
    {
      eventName: "Ўқтувчилар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-10-1 15-15-00"
    },
    {
      eventName: "Ўқтувчилар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-10-1 15-15-00"
    },
    {
      eventName: "Ўзбек тили байрами куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-10-21 15-15-00"
    },
    {
      eventName: "Ўзбек тили байрами куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-10-21 15-15-00"
    },
    {
      eventName: "Ўзбек тили байрами куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-10-21 15-15-00"
    },
    {
      eventName: "Ўзбек тили байрами куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-10-21 15-15-00"
    },
    {
      eventName: "Ўзбек тили байрами куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-10-21 15-15-00"
    },
    {
      eventName: "Янги йил",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-12-31 15-15-00"
    },
    {
      eventName: "Янги йил",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-12-31 15-15-00"
    },
    {
      eventName: "Янги йил",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-12-31 15-15-00"
    },
    {
      eventName: "Янги йил",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-12-31 15-15-00"
    },
    {
      eventName: "Янги йил",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-12-31 15-15-00"
    },
    {
      eventName: "Халқаро хотин-қизлар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2021-3-8 15-15-00"
    },
    {
      eventName: "Халқаро хотин-қизлар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2022-3-8 15-15-00"
    },
    {
      eventName: "Халқаро хотин-қизлар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2023-3-8 15-15-00"
    },
    {
      eventName: "Халқаро хотин-қизлар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2024-3-8 15-15-00"
    },
    {
      eventName: "Халқаро хотин-қизлар куни",
      calendar: "Байрам",
      color: "orange",
      eventTime: "2025-3-8 15-15-00"
    },

    {
      eventName: "Жўраев Асқарали Чориевич  Бойсун тумани ҳокими Бойсун тумани ҳокими 17.03.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-03-17 15-15-00"
    },
    {
      eventName: "Жўраев Асқарали Чориевич  Бойсун тумани ҳокими Бойсун тумани ҳокими 17.03.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-03-17 15-15-00"
    },
    {
      eventName: "Жўраев Асқарали Чориевич  Бойсун тумани ҳокими Бойсун тумани ҳокими 17.03.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-03-17 15-15-00"
    },
    {
      eventName: "Жўраев Асқарали Чориевич  Бойсун тумани ҳокими Бойсун тумани ҳокими 17.03.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-03-17 15-15-00"
    },
    {
      eventName: "Жўраев Асқарали Чориевич  Бойсун тумани ҳокими Бойсун тумани ҳокими 17.03.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-03-17 15-15-00"
    },
    {
      eventName: "Нормаматов Фурқат Абдишукурович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш масалалари бўйича биринчи ўринбосари 06.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-03-06 15-15-00"
    },
    {
      eventName: "Нормаматов Фурқат Абдишукурович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш масалалари бўйича биринчи ўринбосари 06.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-03-06 15-15-00"
    },
    {
      eventName: "Нормаматов Фурқат Абдишукурович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш масалалари бўйича биринчи ўринбосари 06.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-03-06 15-15-00"
    },
    {
      eventName: "Нормаматов Фурқат Абдишукурович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш масалалари бўйича биринчи ўринбосари 06.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-03-06 15-15-00"
    },
    {
      eventName: "Нормаматов Фурқат Абдишукурович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш масалалари бўйича биринчи ўринбосари 06.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-03-06 15-15-00"
    },
    {
      eventName: "Нормўминов Шухрат Ашурович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик масалалари бўйича ўринбосари 20.06.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-06-20 15-15-00"
    },
    {
      eventName: "Нормўминов Шухрат Ашурович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик масалалари бўйича ўринбосари 20.06.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-06-20 15-15-00"
    },
    {
      eventName: "Нормўминов Шухрат Ашурович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик масалалари бўйича ўринбосари 20.06.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-06-20 15-15-00"
    },
    {
      eventName: "Нормўминов Шухрат Ашурович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик масалалари бўйича ўринбосари 20.06.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-06-20 15-15-00"
    },
    {
      eventName: "Нормўминов Шухрат Ашурович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик масалалари бўйича ўринбосари 20.06.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-06-20 15-15-00"
    },
    {
      eventName: "Қодиров Мухаммади Абдираупович Бойсун тумани ҳокимининг ўринбосари - туман инвестициялар ва ташқи савдо бўлими бошлиғи  19.10.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-19 15-15-00"
    },
    {
      eventName: "Қодиров Мухаммади Абдираупович Бойсун тумани ҳокимининг ўринбосари - туман инвестициялар ва ташқи савдо бўлими бошлиғи  19.10.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-19 15-15-00"
    },
    {
      eventName: "Қодиров Мухаммади Абдираупович Бойсун тумани ҳокимининг ўринбосари - туман инвестициялар ва ташқи савдо бўлими бошлиғи  19.10.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-19 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Қодиров Мухаммади Абдираупович Бойсун тумани ҳокимининг ўринбосари - туман инвестициялар ва ташқи савдо бўлими бошлиғи  19.10.1981",
      color: "blue",
      eventTime: "2024-10-19 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Қодиров Мухаммади Абдираупович Бойсун тумани ҳокимининг ўринбосари - туман инвестициялар ва ташқи савдо бўлими бошлиғи  19.10.1981",
      color: "blue",
      eventTime: "2025-10-19 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Абдуназаров Чори Худойназарович  Бойсун тумани ҳокимининг қишлоқ ва сув хўжалиги масалалари бўйича ўринбосари 08.12.1966",
      color: "blue",
      eventTime: "2021-12-8 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Абдуназаров Чори Худойназарович  Бойсун тумани ҳокимининг қишлоқ ва сув хўжалиги масалалари бўйича ўринбосари 08.12.1966",
      color: "blue",
      eventTime: "2022-12-8 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Абдуназаров Чори Худойназарович  Бойсун тумани ҳокимининг қишлоқ ва сув хўжалиги масалалари бўйича ўринбосари 08.12.1966",
      color: "blue",
      eventTime: "2023-12-8 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Абдуназаров Чори Худойназарович  Бойсун тумани ҳокимининг қишлоқ ва сув хўжалиги масалалари бўйича ўринбосари 08.12.1966",
      color: "blue",
      eventTime: "2024-12-8 15-15-00"
    },
    {
      calendar: "Туғилган кун",
      eventName: "Абдуназаров Чори Худойназарович  Бойсун тумани ҳокимининг қишлоқ ва сув хўжалиги масалалари бўйича ўринбосари 08.12.1966",
      color: "blue",
      eventTime: "2025-12-8 15-15-00"
    },
    {
      eventName: "Хафизов Дилмурод Алмосович  Бойсун тумани ҳокимининг ёшлар сиёсати, ижтимоий ривожлантириш ва маънавий-маърифий ишлар бўйича ўринбосари 10.08.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-08-10 15-15-00"
    },
    {
      eventName: "Хафизов Дилмурод Алмосович  Бойсун тумани ҳокимининг ёшлар сиёсати, ижтимоий ривожлантириш ва маънавий-маърифий ишлар бўйича ўринбосари 10.08.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-08-10 15-15-00"
    },
    {
      eventName: "Хафизов Дилмурод Алмосович  Бойсун тумани ҳокимининг ёшлар сиёсати, ижтимоий ривожлантириш ва маънавий-маърифий ишлар бўйича ўринбосари 10.08.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-08-10 15-15-00"
    },
    {
      eventName: "Хафизов Дилмурод Алмосович  Бойсун тумани ҳокимининг ёшлар сиёсати, ижтимоий ривожлантириш ва маънавий-маърифий ишлар бўйича ўринбосари 10.08.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-08-10 15-15-00"
    },
    {
      eventName: "Хафизов Дилмурод Алмосович  Бойсун тумани ҳокимининг ёшлар сиёсати, ижтимоий ривожлантириш ва маънавий-маърифий ишлар бўйича ўринбосари 10.08.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-08-10 15-15-00"
    },
    {
      eventName: "Жўрақулова Саодат Эшқобиловна Бойсун тумани ҳокимининг ўринбосари - Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи 01.03.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-1 15-15-00"
    },
    {
      eventName: "Жўрақулова Саодат Эшқобиловна Бойсун тумани ҳокимининг ўринбосари - Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи 01.03.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-1 15-15-00"
    },
    {
      eventName: "Жўрақулова Саодат Эшқобиловна Бойсун тумани ҳокимининг ўринбосари - Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи 01.03.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-1 15-15-00"
    },
    {
      eventName: "Жўрақулова Саодат Эшқобиловна Бойсун тумани ҳокимининг ўринбосари - Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи 01.03.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-1 15-15-00"
    },
    {
      eventName: "Жўрақулова Саодат Эшқобиловна Бойсун тумани ҳокимининг ўринбосари - Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи 01.03.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-1 15-15-00"
    },
    {
      eventName: "Жўраев Умедилло Турдиевич Бойсун тумани ҳокимининг жамоатчилик билан ишлаш бўйича маслаҳатчиси  29.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-29 15-15-00"
    },
    {
      eventName: "Жўраев Умедилло Турдиевич Бойсун тумани ҳокимининг жамоатчилик билан ишлаш бўйича маслаҳатчиси  29.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-29 15-15-00"
    },
    {
      eventName: "Жўраев Умедилло Турдиевич Бойсун тумани ҳокимининг жамоатчилик билан ишлаш бўйича маслаҳатчиси  29.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-29 15-15-00"
    },
    {
      eventName: "Жўраев Умедилло Турдиевич Бойсун тумани ҳокимининг жамоатчилик билан ишлаш бўйича маслаҳатчиси  29.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-29 15-15-00"
    },
    {
      eventName: "Жўраев Умедилло Турдиевич Бойсун тумани ҳокимининг жамоатчилик билан ишлаш бўйича маслаҳатчиси  29.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-29 15-15-00"
    },
    {
      eventName: "Муродов Ўрал Юсупович Бойсун тумани ҳокимининг Маънавий-маърифий ишлар самарадорлигини ошириш, давлат тили тўғрисидаги қонун ҳужжатларига риоя этилишини таъминлаш масалалари бўйича маслаҳатчиси 10.10.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-10 15-15-00"
    },
    {
      eventName: "Муродов Ўрал Юсупович Бойсун тумани ҳокимининг Маънавий-маърифий ишлар самарадорлигини ошириш, давлат тили тўғрисидаги қонун ҳужжатларига риоя этилишини таъминлаш масалалари бўйича маслаҳатчиси 10.10.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-10 15-15-00"
    },
    {
      eventName: "Муродов Ўрал Юсупович Бойсун тумани ҳокимининг Маънавий-маърифий ишлар самарадорлигини ошириш, давлат тили тўғрисидаги қонун ҳужжатларига риоя этилишини таъминлаш масалалари бўйича маслаҳатчиси 10.10.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-10 15-15-00"
    },
    {
      eventName: "Муродов Ўрал Юсупович Бойсун тумани ҳокимининг Маънавий-маърифий ишлар самарадорлигини ошириш, давлат тили тўғрисидаги қонун ҳужжатларига риоя этилишини таъминлаш масалалари бўйича маслаҳатчиси 10.10.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-10 15-15-00"
    },
    {
      eventName: "Муродов Ўрал Юсупович Бойсун тумани ҳокимининг Маънавий-маърифий ишлар самарадорлигини ошириш, давлат тили тўғрисидаги қонун ҳужжатларига риоя этилишини таъминлаш масалалари бўйича маслаҳатчиси 10.10.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-10 15-15-00"
    },
    {
      eventName: "Яхшиева Интизор Холмуродовна Бойсун тумани ҳокимининг хотин-қизлар масалалари бўйича маслаҳатчиси 08.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-8 15-15-00"
    },
    {
      eventName: "Яхшиева Интизор Холмуродовна Бойсун тумани ҳокимининг хотин-қизлар масалалари бўйича маслаҳатчиси 08.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-8 15-15-00"
    },
    {
      eventName: "Яхшиева Интизор Холмуродовна Бойсун тумани ҳокимининг хотин-қизлар масалалари бўйича маслаҳатчиси 08.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-8 15-15-00"
    },
    {
      eventName: "Яхшиева Интизор Холмуродовна Бойсун тумани ҳокимининг хотин-қизлар масалалари бўйича маслаҳатчиси 08.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-8 15-15-00"
    },
    {
      eventName: "Яхшиева Интизор Холмуродовна Бойсун тумани ҳокимининг хотин-қизлар масалалари бўйича маслаҳатчиси 08.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-8 15-15-00"
    },
    {
      eventName: "Холиёров Юнус Шавкатович Бойсун тумани ҳокимлиги ахборот хизмати раҳбари 01.01.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-1 15-15-00"
    },
    {
      eventName: "Холиёров Юнус Шавкатович Бойсун тумани ҳокимлиги ахборот хизмати раҳбари 01.01.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-1 15-15-00"
    },
    {
      eventName: "Холиёров Юнус Шавкатович Бойсун тумани ҳокимлиги ахборот хизмати раҳбари 01.01.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-1 15-15-00"
    },
    {
      eventName: "Холиёров Юнус Шавкатович Бойсун тумани ҳокимлиги ахборот хизмати раҳбари 01.01.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-1 15-15-00"
    },
    {
      eventName: "Холиёров Юнус Шавкатович Бойсун тумани ҳокимлиги ахборот хизмати раҳбари 01.01.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-1 15-15-00"
    },
    {
      eventName: "Ҳайитов Мирзоҳид Уролович Бойсун тумани прокурори 23.03.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-23 15-15-00"
    },
    {
      eventName: "Ҳайитов Мирзоҳид Уролович Бойсун тумани прокурори 23.03.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-23 15-15-00"
    },
    {
      eventName: "Ҳайитов Мирзоҳид Уролович Бойсун тумани прокурори 23.03.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-23 15-15-00"
    },
    {
      eventName: "Ҳайитов Мирзоҳид Уролович Бойсун тумани прокурори 23.03.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-23 15-15-00"
    },
    {
      eventName: "Ҳайитов Мирзоҳид Уролович Бойсун тумани прокурори 23.03.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-23 15-15-00"
    },
    {
      eventName: "Бобоев Дўстмурод Қурбонмуротович Бойсун тумани ИИБ бошлиғи 16.11.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-16 15-15-00"
    },
    {
      eventName: "Бобоев Дўстмурод Қурбонмуротович Бойсун тумани ИИБ бошлиғи 16.11.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-16 15-15-00"
    },
    {
      eventName: "Бобоев Дўстмурод Қурбонмуротович Бойсун тумани ИИБ бошлиғи 16.11.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-16 15-15-00"
    },
    {
      eventName: "Бобоев Дўстмурод Қурбонмуротович Бойсун тумани ИИБ бошлиғи 16.11.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-16 15-15-00"
    },
    {
      eventName: "Бобоев Дўстмурод Қурбонмуротович Бойсун тумани ИИБ бошлиғи 16.11.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-16 15-15-00"
    },
    {
      eventName: "Акрамов Бахриддин Баракаевич Бойсун тумани ДСИ бошлиғи 27.11.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-27 15-15-00"
    },
    {
      eventName: "Акрамов Бахриддин Баракаевич Бойсун тумани ДСИ бошлиғи 27.11.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-27 15-15-00"
    },
    {
      eventName: "Акрамов Бахриддин Баракаевич Бойсун тумани ДСИ бошлиғи 27.11.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-27 15-15-00"
    },
    {
      eventName: "Акрамов Бахриддин Баракаевич Бойсун тумани ДСИ бошлиғи 27.11.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-27 15-15-00"
    },
    {
      eventName: "Акрамов Бахриддин Баракаевич Бойсун тумани ДСИ бошлиғи 27.11.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-27 15-15-00"
    },
    {
      eventName: "Фозилов Абдулазиз Эркинович Давлат хавфсизлик хизмати Бойсун туман бўлинмаси бошлиғи 04.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-4 15-15-00"
    },
    {
      eventName: "Фозилов Абдулазиз Эркинович Давлат хавфсизлик хизмати Бойсун туман бўлинмаси бошлиғи 04.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-4 15-15-00"
    },
    {
      eventName: "Фозилов Абдулазиз Эркинович Давлат хавфсизлик хизмати Бойсун туман бўлинмаси бошлиғи 04.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-4 15-15-00"
    },
    {
      eventName: "Фозилов Абдулазиз Эркинович Давлат хавфсизлик хизмати Бойсун туман бўлинмаси бошлиғи 04.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-4 15-15-00"
    },
    {
      eventName: "Фозилов Абдулазиз Эркинович Давлат хавфсизлик хизмати Бойсун туман бўлинмаси бошлиғи 04.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-4 15-15-00"
    },
    {
      eventName: "Холиқов Хусан Хуррамович O’zLiDeP Бойсун туман Кенгаши ижро аппарати раҳбари 10.02.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-10 15-15-00"
    },
    {
      eventName: "Холиқов Хусан Хуррамович O’zLiDeP Бойсун туман Кенгаши ижро аппарати раҳбари 10.02.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-10 15-15-00"
    },
    {
      eventName: "Холиқов Хусан Хуррамович O’zLiDeP Бойсун туман Кенгаши ижро аппарати раҳбари 10.02.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-10 15-15-00"
    },
    {
      eventName: "Холиқов Хусан Хуррамович O’zLiDeP Бойсун туман Кенгаши ижро аппарати раҳбари 10.02.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-10 15-15-00"
    },
    {
      eventName: "Холиқов Хусан Хуррамович O’zLiDeP Бойсун туман Кенгаши ижро аппарати раҳбари 10.02.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-10 15-15-00"
    },
    {
      eventName: "Каримов Жўрақул Амонович O’zLiDeP Бойсун туман Кенгаши ижрочи котиби 12.10.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-12 15-15-00"
    },
    {
      eventName: "Каримов Жўрақул Амонович O’zLiDeP Бойсун туман Кенгаши ижрочи котиби 12.10.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-12 15-15-00"
    },
    {
      eventName: "Каримов Жўрақул Амонович O’zLiDeP Бойсун туман Кенгаши ижрочи котиби 12.10.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-12 15-15-00"
    },
    {
      eventName: "Каримов Жўрақул Амонович O’zLiDeP Бойсун туман Кенгаши ижрочи котиби 12.10.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-12 15-15-00"
    },
    {
      eventName: "Каримов Жўрақул Амонович O’zLiDeP Бойсун туман Кенгаши ижрочи котиби 12.10.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-12 15-15-00"
    },
    {
      eventName: "Мамадиев Нодир Холмуродович Бойсун тумани Адлия бўлими бошлиғи 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-15 15-15-00"
    },
    {
      eventName: "Мамадиев Нодир Холмуродович Бойсун тумани Адлия бўлими бошлиғи 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-15 15-15-00"
    },
    {
      eventName: "Мамадиев Нодир Холмуродович Бойсун тумани Адлия бўлими бошлиғи 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-15 15-15-00"
    },
    {
      eventName: "Мамадиев Нодир Холмуродович Бойсун тумани Адлия бўлими бошлиғи 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-15 15-15-00"
    },
    {
      eventName: "Мамадиев Нодир Холмуродович Бойсун тумани Адлия бўлими бошлиғи 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-15 15-15-00"
    },
    {
      eventName: " Ғаниев Сухробжон Фурқатович Бойсун тумани Мудофаа ишлари бўлими бошлиғи 08.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-8 15-15-00"
    },
    {
      eventName: " Ғаниев Сухробжон Фурқатович Бойсун тумани Мудофаа ишлари бўлими бошлиғи 08.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-8 15-15-00"
    },
    {
      eventName: " Ғаниев Сухробжон Фурқатович Бойсун тумани Мудофаа ишлари бўлими бошлиғи 08.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-8 15-15-00"
    },
    {
      eventName: " Ғаниев Сухробжон Фурқатович Бойсун тумани Мудофаа ишлари бўлими бошлиғи 08.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-8 15-15-00"
    },
    {
      eventName: " Ғаниев Сухробжон Фурқатович Бойсун тумани Мудофаа ишлари бўлими бошлиғи 08.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-8 15-15-00"
    },
    {
      eventName: "Мирзаев Бахриддин Турдимуродович Бойсун тумани Фавқулотда вазиятлар бўлими бошлиғи 03.07.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-3 15-15-00"
    },
    {
      eventName: "Мирзаев Бахриддин Турдимуродович Бойсун тумани Фавқулотда вазиятлар бўлими бошлиғи 03.07.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-3 15-15-00"
    },
    {
      eventName: "Мирзаев Бахриддин Турдимуродович Бойсун тумани Фавқулотда вазиятлар бўлими бошлиғи 03.07.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-3 15-15-00"
    },
    {
      eventName: "Мирзаев Бахриддин Турдимуродович Бойсун тумани Фавқулотда вазиятлар бўлими бошлиғи 03.07.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-3 15-15-00"
    },
    {
      eventName: "Мирзаев Бахриддин Турдимуродович Бойсун тумани Фавқулотда вазиятлар бўлими бошлиғи 03.07.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-3 15-15-00"
    },
    {
      eventName: "Жумаев Тўра Йўлдошевич Бойсун тумани Молия бўлими бошлиғи 20.01.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-20 15-15-00"
    },
    {
      eventName: "Жумаев Тўра Йўлдошевич Бойсун тумани Молия бўлими бошлиғи 20.01.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-20 15-15-00"
    },
    {
      eventName: "Жумаев Тўра Йўлдошевич Бойсун тумани Молия бўлими бошлиғи 20.01.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-20 15-15-00"
    },
    {
      eventName: "Жумаев Тўра Йўлдошевич Бойсун тумани Молия бўлими бошлиғи 20.01.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-20 15-15-00"
    },
    {
      eventName: "Жумаев Тўра Йўлдошевич Бойсун тумани Молия бўлими бошлиғи 20.01.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-20 15-15-00"
    },
    {
      eventName: "Болтаев Раҳматулло Шобердиевич АТБ “Агро банк” Бойсун тумани филиали бошқарувчиси 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-15 15-15-00"
    },
    {
      eventName: "Болтаев Раҳматулло Шобердиевич АТБ “Агро банк” Бойсун тумани филиали бошқарувчиси 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-15 15-15-00"
    },
    {
      eventName: "Болтаев Раҳматулло Шобердиевич АТБ “Агро банк” Бойсун тумани филиали бошқарувчиси 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-15 15-15-00"
    },
    {
      eventName: "Болтаев Раҳматулло Шобердиевич АТБ “Агро банк” Бойсун тумани филиали бошқарувчиси 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-15 15-15-00"
    },
    {
      eventName: "Болтаев Раҳматулло Шобердиевич АТБ “Агро банк” Бойсун тумани филиали бошқарувчиси 15.12.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-15 15-15-00"
    },
    {
      eventName: "Боймиров Отабек Холбекович АТБ “Халқ банки” Бойсун тумани филиали бошқарувчиси 25.07.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-25 15-15-00"
    },
    {
      eventName: "Боймиров Отабек Холбекович АТБ “Халқ банки” Бойсун тумани филиали бошқарувчиси 25.07.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-25 15-15-00"
    },
    {
      eventName: "Боймиров Отабек Холбекович АТБ “Халқ банки” Бойсун тумани филиали бошқарувчиси 25.07.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-25 15-15-00"
    },
    {
      eventName: "Боймиров Отабек Холбекович АТБ “Халқ банки” Бойсун тумани филиали бошқарувчиси 25.07.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-25 15-15-00"
    },
    {
      eventName: "Боймиров Отабек Холбекович АТБ “Халқ банки” Бойсун тумани филиали бошқарувчиси 25.07.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-25 15-15-00"
    },
    {
      eventName: "Саидов Анвар Рўзиевич Бойсун тумани Статистика бўлими бошлиғи  18.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-18 15-15-00"
    },
    {
      eventName: "Саидов Анвар Рўзиевич Бойсун тумани Статистика бўлими бошлиғи  18.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-18 15-15-00"
    },
    {
      eventName: "Саидов Анвар Рўзиевич Бойсун тумани Статистика бўлими бошлиғи  18.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-18 15-15-00"
    },
    {
      eventName: "Саидов Анвар Рўзиевич Бойсун тумани Статистика бўлими бошлиғи  18.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-18 15-15-00"
    },
    {
      eventName: "Саидов Анвар Рўзиевич Бойсун тумани Статистика бўлими бошлиғи  18.07.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-18 15-15-00"
    },
    {
      eventName: "Сохибов Бахриддин Оллоёрович Бойсун тумани халқ таълими бўлими мудири 20.02.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-20 15-15-00"
    },
    {
      eventName: "Сохибов Бахриддин Оллоёрович Бойсун тумани халқ таълими бўлими мудири 20.02.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-20 15-15-00"
    },
    {
      eventName: "Сохибов Бахриддин Оллоёрович Бойсун тумани халқ таълими бўлими мудири 20.02.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-20 15-15-00"
    },
    {
      eventName: "Сохибов Бахриддин Оллоёрович Бойсун тумани халқ таълими бўлими мудири 20.02.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-20 15-15-00"
    },
    {
      eventName: "Сохибов Бахриддин Оллоёрович Бойсун тумани халқ таълими бўлими мудири 20.02.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-20 15-15-00"
    },
    {
      eventName: "Бозоров Ҳамза Нуриддинович  Бойсун тумани Маданият бўлими бошлиғи 09.06.1974 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-9 15-15-00"
    },
    {
      eventName: "Бозоров Ҳамза Нуриддинович  Бойсун тумани Маданият бўлими бошлиғи 09.06.1974 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-9 15-15-00"
    },
    {
      eventName: "Бозоров Ҳамза Нуриддинович  Бойсун тумани Маданият бўлими бошлиғи 09.06.1974 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-9 15-15-00"
    },
    {
      eventName: "Бозоров Ҳамза Нуриддинович  Бойсун тумани Маданият бўлими бошлиғи 09.06.1974 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-9 15-15-00"
    },
    {
      eventName: "Бозоров Ҳамза Нуриддинович  Бойсун тумани Маданият бўлими бошлиғи 09.06.1974 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-9 15-15-00"
    },
    {
      eventName: "Пардаев Норали Шукурович  Бойсун тумани Туризм ва спорт бўлими бошлиғи  25.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-25 15-15-00"
    },
    {
      eventName: "Пардаев Норали Шукурович  Бойсун тумани Туризм ва спорт бўлими бошлиғи  25.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-25 15-15-00"
    },
    {
      eventName: "Пардаев Норали Шукурович  Бойсун тумани Туризм ва спорт бўлими бошлиғи  25.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-25 15-15-00"
    },
    {
      eventName: "Пардаев Норали Шукурович  Бойсун тумани Туризм ва спорт бўлими бошлиғи  25.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-25 15-15-00"
    },
    {
      eventName: "Пардаев Норали Шукурович  Бойсун тумани Туризм ва спорт бўлими бошлиғи  25.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-25 15-15-00"
    },
    {
      eventName: "Одинаев Рустам Урунович Бойсун тумани Тиббиёт бирлашмаси бошлиғи 16.02.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-16 15-15-00"
    },
    {
      eventName: "Одинаев Рустам Урунович Бойсун тумани Тиббиёт бирлашмаси бошлиғи 16.02.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-16 15-15-00"
    },
    {
      eventName: "Одинаев Рустам Урунович Бойсун тумани Тиббиёт бирлашмаси бошлиғи 16.02.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-16 15-15-00"
    },
    {
      eventName: "Одинаев Рустам Урунович Бойсун тумани Тиббиёт бирлашмаси бошлиғи 16.02.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-16 15-15-00"
    },
    {
      eventName: "Одинаев Рустам Урунович Бойсун тумани Тиббиёт бирлашмаси бошлиғи 16.02.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-16 15-15-00"
    },
    {
      eventName: "Газиева Сурайё Юлдашевна Республика Маънавият ва маърифат марказининг Сурхондарё вилояти Бойсун туман бўлинмаси раҳбари 17.06.1970",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2021 15-15-00"
    },
    {
      eventName: "Газиева Сурайё Юлдашевна Республика Маънавият ва маърифат марказининг Сурхондарё вилояти Бойсун туман бўлинмаси раҳбари 17.06.1970",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2022 15-15-00"
    },
    {
      eventName: "Газиева Сурайё Юлдашевна Республика Маънавият ва маърифат марказининг Сурхондарё вилояти Бойсун туман бўлинмаси раҳбари 17.06.1970",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2023 15-15-00"
    },
    {
      eventName: "Газиева Сурайё Юлдашевна Республика Маънавият ва маърифат марказининг Сурхондарё вилояти Бойсун туман бўлинмаси раҳбари 17.06.1970",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2024 15-15-00"
    },
    {
      eventName: "Газиева Сурайё Юлдашевна Республика Маънавият ва маърифат марказининг Сурхондарё вилояти Бойсун туман бўлинмаси раҳбари 17.06.1970",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2025 15-15-00"
    },
    {
      eventName: "Ҳусанов Абулфаттох Муҳаммаддиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бошлиғи 16.04.1987",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2021-4-16 15-15-00"
    },
    {
      eventName: "Ҳусанов Абулфаттох Муҳаммаддиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бошлиғи 16.04.1987",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2022-4-16 15-15-00"
    },
    {
      eventName: "Ҳусанов Абулфаттох Муҳаммаддиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бошлиғи 16.04.1987",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2023-4-16 15-15-00"
    },
    {
      eventName: "Ҳусанов Абулфаттох Муҳаммаддиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бошлиғи 16.04.1987",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2024-4-16 15-15-00"
    },
    {
      eventName: "Ҳусанов Абулфаттох Муҳаммаддиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бошлиғи 16.04.1987",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2025-4-16 15-15-00"
    },
    {
      eventName: "Қулмаматов Нодир Собир ўғли Ўзбекистон ёшлар иттифоқи Бойсун тумани Кенгаши раиси 09.08.1991",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2021-8-9 15-15-00"
    },
    {
      eventName: "Қулмаматов Нодир Собир ўғли Ўзбекистон ёшлар иттифоқи Бойсун тумани Кенгаши раиси 09.08.1991",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2022-8-9 15-15-00"
    },
    {
      eventName: "Қулмаматов Нодир Собир ўғли Ўзбекистон ёшлар иттифоқи Бойсун тумани Кенгаши раиси 09.08.1991",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2023-8-9 15-15-00"
    },
    {
      eventName: "Қулмаматов Нодир Собир ўғли Ўзбекистон ёшлар иттифоқи Бойсун тумани Кенгаши раиси 09.08.1991",
      color: "blue",
      calendar: "Туғилган кун",
      eventTime: "2024-8-9 15-15-00"
    },
    {
      eventName: "Қулмаматов Нодир Собир ўғли Ўзбекистон ёшлар иттифоқи Бойсун тумани Кенгаши раиси 09.08.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-9 15-15-00"
    },
    {
      eventName: "Нормаматов Бахтиёр Худойбердиевич “Hududgaz Surxondaryo” газ таъминоти Бойсун туман филиали бошлиғи  24.09.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-24 15-15-00"
    },
    {
      eventName: "Нормаматов Бахтиёр Худойбердиевич “Hududgaz Surxondaryo” газ таъминоти Бойсун туман филиали бошлиғи  24.09.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-24 15-15-00"
    },
    {
      eventName: "Нормаматов Бахтиёр Худойбердиевич “Hududgaz Surxondaryo” газ таъминоти Бойсун туман филиали бошлиғи  24.09.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-24 15-15-00"
    },
    {
      eventName: "Нормаматов Бахтиёр Худойбердиевич “Hududgaz Surxondaryo” газ таъминоти Бойсун туман филиали бошлиғи  24.09.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-24 15-15-00"
    },
    {
      eventName: "Нормаматов Бахтиёр Худойбердиевич “Hududgaz Surxondaryo” газ таъминоти Бойсун туман филиали бошлиғи  24.09.1964",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-24 15-15-00"
    },
    {
      eventName: "Хайдаров Шавкат Бобоқулович Бойсун тумани Ободонлаштириш корхонаси раҳбари 28.11.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-28 15-15-00"
    },
    {
      eventName: "Хайдаров Шавкат Бобоқулович Бойсун тумани Ободонлаштириш корхонаси раҳбари 28.11.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-28 15-15-00"
    },
    {
      eventName: "Хайдаров Шавкат Бобоқулович Бойсун тумани Ободонлаштириш корхонаси раҳбари 28.11.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-28 15-15-00"
    },
    {
      eventName: "Хайдаров Шавкат Бобоқулович Бойсун тумани Ободонлаштириш корхонаси раҳбари 28.11.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-28 15-15-00"
    },
    {
      eventName: "Хайдаров Шавкат Бобоқулович Бойсун тумани Ободонлаштириш корхонаси раҳбари 28.11.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-28 15-15-00"
    },
    {
      eventName: "Ғаффоров Зиёдулло Сатторович Бойсун тумани йўллардан фойдаланиш унитар корхонаси раҳбари в.б 29.01.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-29 15-15-00"
    },
    {
      eventName: "Ғаффоров Зиёдулло Сатторович Бойсун тумани йўллардан фойдаланиш унитар корхонаси раҳбари в.б 29.01.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-29 15-15-00"
    },
    {
      eventName: "Ғаффоров Зиёдулло Сатторович Бойсун тумани йўллардан фойдаланиш унитар корхонаси раҳбари в.б 29.01.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-29 15-15-00"
    },
    {
      eventName: "Ғаффоров Зиёдулло Сатторович Бойсун тумани йўллардан фойдаланиш унитар корхонаси раҳбари в.б 29.01.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-29 15-15-00"
    },
    {
      eventName: "Ғаффоров Зиёдулло Сатторович Бойсун тумани йўллардан фойдаланиш унитар корхонаси раҳбари в.б 29.01.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-29 15-15-00"
    },
    {
      eventName: "Рамазонов Холбек Нематович Кадастр агентлиги Бойсун тумани бўлинмаси бошлиғи 21.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-21 15-15-00"
    },
    {
      eventName: "Рамазонов Холбек Нематович Кадастр агентлиги Бойсун тумани бўлинмаси бошлиғи 21.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-21 15-15-00"
    },
    {
      eventName: "Рамазонов Холбек Нематович Кадастр агентлиги Бойсун тумани бўлинмаси бошлиғи 21.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-21 15-15-00"
    },
    {
      eventName: "Рамазонов Холбек Нематович Кадастр агентлиги Бойсун тумани бўлинмаси бошлиғи 21.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-21 15-15-00"
    },
    {
      eventName: "Рамазонов Холбек Нематович Кадастр агентлиги Бойсун тумани бўлинмаси бошлиғи 21.01.1979",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-21 15-15-00"
    },
    {
      eventName: "Умаров Бахром Зокирович Бойсун тумани “Матбуот тарқатувчи” МЧЖ раҳбари 14.09.1963",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-14 15-15-00"
    },
    {
      eventName: "Умаров Бахром Зокирович Бойсун тумани “Матбуот тарқатувчи” МЧЖ раҳбари 14.09.1963",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-14 15-15-00"
    },
    {
      eventName: "Умаров Бахром Зокирович Бойсун тумани “Матбуот тарқатувчи” МЧЖ раҳбари 14.09.1963",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-14 15-15-00"
    },
    {
      eventName: "Умаров Бахром Зокирович Бойсун тумани “Матбуот тарқатувчи” МЧЖ раҳбари 14.09.1963",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-14 15-15-00"
    },
    {
      eventName: "Умаров Бахром Зокирович Бойсун тумани “Матбуот тарқатувчи” МЧЖ раҳбари 14.09.1963",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-14 15-15-00"
    },
    {
      eventName: "Ғаффоров Ғайрат Худойкулович Бойсун тумани Телекоммуникация боғламаси бошлиғи 07.08.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-7 15-15-00"
    },
    {
      eventName: "Ғаффоров Ғайрат Худойкулович Бойсун тумани Телекоммуникация боғламаси бошлиғи 07.08.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-7 15-15-00"
    },
    {
      eventName: "Ғаффоров Ғайрат Худойкулович Бойсун тумани Телекоммуникация боғламаси бошлиғи 07.08.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-7 15-15-00"
    },
    {
      eventName: "Ғаффоров Ғайрат Худойкулович Бойсун тумани Телекоммуникация боғламаси бошлиғи 07.08.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-7 15-15-00"
    },
    {
      eventName: "Ғаффоров Ғайрат Худойкулович Бойсун тумани Телекоммуникация боғламаси бошлиғи 07.08.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-7 15-15-00"
    },
    {
      eventName: "Қулмирзаев Элмурод Хўжаназарович Бойсун тумани Ирригация бўлими бошлиғи 11.07.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-11 15-15-00"
    },
    {
      eventName: "Қулмирзаев Элмурод Хўжаназарович Бойсун тумани Ирригация бўлими бошлиғи 11.07.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-11 15-15-00"
    },
    {
      eventName: "Қулмирзаев Элмурод Хўжаназарович Бойсун тумани Ирригация бўлими бошлиғи 11.07.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-11 15-15-00"
    },
    {
      eventName: "Қулмирзаев Элмурод Хўжаназарович Бойсун тумани Ирригация бўлими бошлиғи 11.07.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-11 15-15-00"
    },
    {
      eventName: "Қулмирзаев Элмурод Хўжаназарович Бойсун тумани Ирригация бўлими бошлиғи 11.07.1986",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-11 15-15-00"
    },
    {
      eventName: "Каримов Абдусаттор Исмоилович “Сувоқова” ДУК Бойсун тумани филиали бошлиғи 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-3 15-15-00"
    },
    {
      eventName: "Каримов Абдусаттор Исмоилович “Сувоқова” ДУК Бойсун тумани филиали бошлиғи 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-3 15-15-00"
    },
    {
      eventName: "Каримов Абдусаттор Исмоилович “Сувоқова” ДУК Бойсун тумани филиали бошлиғи 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-3 15-15-00"
    },
    {
      eventName: "Каримов Абдусаттор Исмоилович “Сувоқова” ДУК Бойсун тумани филиали бошлиғи 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-3 15-15-00"
    },
    {
      eventName: "Каримов Абдусаттор Исмоилович “Сувоқова” ДУК Бойсун тумани филиали бошлиғи 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-3 15-15-00"
    },
    {
      eventName: "Норов Зиёдулла Эгамович Бойсун тумани фермер, деҳқон хўжаликлари ва томарқа ер эгалари Кенгаши ҳузуридаги бухгалтерия маркази директори 31.01.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-31 15-15-00"
    },
    {
      eventName: "Норов Зиёдулла Эгамович Бойсун тумани фермер, деҳқон хўжаликлари ва томарқа ер эгалари Кенгаши ҳузуридаги бухгалтерия маркази директори 31.01.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-31 15-15-00"
    },
    {
      eventName: "Норов Зиёдулла Эгамович Бойсун тумани фермер, деҳқон хўжаликлари ва томарқа ер эгалари Кенгаши ҳузуридаги бухгалтерия маркази директори 31.01.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-31 15-15-00"
    },
    {
      eventName: "Норов Зиёдулла Эгамович Бойсун тумани фермер, деҳқон хўжаликлари ва томарқа ер эгалари Кенгаши ҳузуридаги бухгалтерия маркази директори 31.01.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-31 15-15-00"
    },
    {
      eventName: "Норов Зиёдулла Эгамович Бойсун тумани фермер, деҳқон хўжаликлари ва томарқа ер эгалари Кенгаши ҳузуридаги бухгалтерия маркази директори 31.01.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-31 15-15-00"
    },
    {
      eventName: "Ходжаев Холбек Исматович Бойсун тумани Агроринспекция бўлими бошлиғи 05.12.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-12 15-15-00"
    },
    {
      eventName: "Ходжаев Холбек Исматович Бойсун тумани Агроринспекция бўлими бошлиғи 05.12.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-12 15-15-00"
    },
    {
      eventName: "Ходжаев Холбек Исматович Бойсун тумани Агроринспекция бўлими бошлиғи 05.12.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-12 15-15-00"
    },
    {
      eventName: "Ходжаев Холбек Исматович Бойсун тумани Агроринспекция бўлими бошлиғи 05.12.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-12 15-15-00"
    },
    {
      eventName: "Ходжаев Холбек Исматович Бойсун тумани Агроринспекция бўлими бошлиғи 05.12.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-12 15-15-00"
    },
    {
      eventName: "Улуқов Беҳзод Рахматиллоевич Бойсун тумани Ғазначилик бўлинмаси бошлиғи 22.05.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-22 15-15-00"
    },
    {
      eventName: "Улуқов Беҳзод Рахматиллоевич Бойсун тумани Ғазначилик бўлинмаси бошлиғи 22.05.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-22 15-15-00"
    },
    {
      eventName: "Улуқов Беҳзод Рахматиллоевич Бойсун тумани Ғазначилик бўлинмаси бошлиғи 22.05.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-22 15-15-00"
    },
    {
      eventName: "Улуқов Беҳзод Рахматиллоевич Бойсун тумани Ғазначилик бўлинмаси бошлиғи 22.05.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-22 15-15-00"
    },
    {
      eventName: "Улуқов Беҳзод Рахматиллоевич Бойсун тумани Ғазначилик бўлинмаси бошлиғи 22.05.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-22 15-15-00"
    },
    {
      eventName: "Бекназаров Ашурали Пардаевич Бойсун тумани Бюджетдан ташқари Пенсия жамғармаси бўлими бошлиғи 21.01.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-21 15-15-00"
    },
    {
      eventName: "Бекназаров Ашурали Пардаевич Бойсун тумани Бюджетдан ташқари Пенсия жамғармаси бўлими бошлиғи 21.01.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-21 15-15-00"
    },
    {
      eventName: "Бекназаров Ашурали Пардаевич Бойсун тумани Бюджетдан ташқари Пенсия жамғармаси бўлими бошлиғи 21.01.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-21 15-15-00"
    },
    {
      eventName: "Бекназаров Ашурали Пардаевич Бойсун тумани Бюджетдан ташқари Пенсия жамғармаси бўлими бошлиғи 21.01.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-21 15-15-00"
    },
    {
      eventName: "Бекназаров Ашурали Пардаевич Бойсун тумани Бюджетдан ташқари Пенсия жамғармаси бўлими бошлиғи 21.01.1975",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-21 15-15-00"
    },
    {
      eventName: "Рахматов Жамшид Сафарович Бойсун тумани Электр тармоқлари корхонаси бошлиғи 25.06.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-25 15-15-00"
    },
    {
      eventName: "Рахматов Жамшид Сафарович Бойсун тумани Электр тармоқлари корхонаси бошлиғи 25.06.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-25 15-15-00"
    },
    {
      eventName: "Рахматов Жамшид Сафарович Бойсун тумани Электр тармоқлари корхонаси бошлиғи 25.06.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-25 15-15-00"
    },
    {
      eventName: "Рахматов Жамшид Сафарович Бойсун тумани Электр тармоқлари корхонаси бошлиғи 25.06.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-25 15-15-00"
    },
    {
      eventName: "Рахматов Жамшид Сафарович Бойсун тумани Электр тармоқлари корхонаси бошлиғи 25.06.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-25 15-15-00"
    },
    {
      eventName: "Рухиддинов Жалол Жафарович Бойсун тумани мудофаага кўмаклашувчи “Ватанпарвар” ташкилоти раиси 10.03.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-10 15-15-00"
    },
    {
      eventName: "Рухиддинов Жалол Жафарович Бойсун тумани мудофаага кўмаклашувчи “Ватанпарвар” ташкилоти раиси 10.03.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-10 15-15-00"
    },
    {
      eventName: "Рухиддинов Жалол Жафарович Бойсун тумани мудофаага кўмаклашувчи “Ватанпарвар” ташкилоти раиси 10.03.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-10 15-15-00"
    },
    {
      eventName: "Рухиддинов Жалол Жафарович Бойсун тумани мудофаага кўмаклашувчи “Ватанпарвар” ташкилоти раиси 10.03.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-10 15-15-00"
    },
    {
      eventName: "Рухиддинов Жалол Жафарович Бойсун тумани мудофаага кўмаклашувчи “Ватанпарвар” ташкилоти раиси 10.03.1962",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-10 15-15-00"
    },
    {
      eventName: "Рахимов Мамаюсуф Холиқулович Бойсун тумани Болалар ва ўсмирлар спорт мактаби директори 16.06.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-16 15-15-00"
    },
    {
      eventName: "Рахимов Мамаюсуф Холиқулович Бойсун тумани Болалар ва ўсмирлар спорт мактаби директори 16.06.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-16 15-15-00"
    },
    {
      eventName: "Рахимов Мамаюсуф Холиқулович Бойсун тумани Болалар ва ўсмирлар спорт мактаби директори 16.06.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-16 15-15-00"
    },
    {
      eventName: "Рахимов Мамаюсуф Холиқулович Бойсун тумани Болалар ва ўсмирлар спорт мактаби директори 16.06.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-16 15-15-00"
    },
    {
      eventName: "Рахимов Мамаюсуф Холиқулович Бойсун тумани Болалар ва ўсмирлар спорт мактаби директори 16.06.1988",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-16 15-15-00"
    },
    {
      eventName: "Ҳайдаров Бахтиёр Иззатиллоевич “Тоза ҳудуд” давлат унитар корхонаси Бойсун тумани филиали бошлиғи 13.09.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-13 15-15-00"
    },
    {
      eventName: "Ҳайдаров Бахтиёр Иззатиллоевич “Тоза ҳудуд” давлат унитар корхонаси Бойсун тумани филиали бошлиғи 13.09.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-13 15-15-00"
    },
    {
      eventName: "Ҳайдаров Бахтиёр Иззатиллоевич “Тоза ҳудуд” давлат унитар корхонаси Бойсун тумани филиали бошлиғи 13.09.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-13 15-15-00"
    },
    {
      eventName: "Ҳайдаров Бахтиёр Иззатиллоевич “Тоза ҳудуд” давлат унитар корхонаси Бойсун тумани филиали бошлиғи 13.09.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-13 15-15-00"
    },
    {
      eventName: "Ҳайдаров Бахтиёр Иззатиллоевич “Тоза ҳудуд” давлат унитар корхонаси Бойсун тумани филиали бошлиғи 13.09.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-13 15-15-00"
    },
    {
      eventName: "Жўраев Юсуф Холиёрович Бойсун тумани Уй-жой коммунал хизмат кўрсатиш бўлими бошлиғи 21.04.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-21 15-15-00"
    },
    {
      eventName: "Жўраев Юсуф Холиёрович Бойсун тумани Уй-жой коммунал хизмат кўрсатиш бўлими бошлиғи 21.04.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-21 15-15-00"
    },
    {
      eventName: "Жўраев Юсуф Холиёрович Бойсун тумани Уй-жой коммунал хизмат кўрсатиш бўлими бошлиғи 21.04.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-21 15-15-00"
    },
    {
      eventName: "Жўраев Юсуф Холиёрович Бойсун тумани Уй-жой коммунал хизмат кўрсатиш бўлими бошлиғи 21.04.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-21 15-15-00"
    },
    {
      eventName: "Жўраев Юсуф Холиёрович Бойсун тумани Уй-жой коммунал хизмат кўрсатиш бўлими бошлиғи 21.04.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-21 15-15-00"
    },
    {
      eventName: "Соибназаров Акмал Мамаражабович Бойсун тумани Қурилиш бўлими бошлиғи 11.03.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-11 15-15-00"
    },
    {
      eventName: "Соибназаров Акмал Мамаражабович Бойсун тумани Қурилиш бўлими бошлиғи 11.03.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-11 15-15-00"
    },
    {
      eventName: "Соибназаров Акмал Мамаражабович Бойсун тумани Қурилиш бўлими бошлиғи 11.03.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-11 15-15-00"
    },
    {
      eventName: "Соибназаров Акмал Мамаражабович Бойсун тумани Қурилиш бўлими бошлиғи 11.03.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-11 15-15-00"
    },
    {
      eventName: "Соибназаров Акмал Мамаражабович Бойсун тумани Қурилиш бўлими бошлиғи 11.03.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-11 15-15-00"
    },
    {
      eventName: "Абдуллаев Даврон Мусурмонович   Бойсун тумани Давлат архиви директори 25.08.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-25 15-15-00"
    },
    {
      eventName: "Абдуллаев Даврон Мусурмонович   Бойсун тумани Давлат архиви директори 25.08.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-25 15-15-00"
    },
    {
      eventName: "Абдуллаев Даврон Мусурмонович   Бойсун тумани Давлат архиви директори 25.08.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-25 15-15-00"
    },
    {
      eventName: "Абдуллаев Даврон Мусурмонович   Бойсун тумани Давлат архиви директори 25.08.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-25 15-15-00"
    },
    {
      eventName: "Абдуллаев Даврон Мусурмонович   Бойсун тумани Давлат архиви директори 25.08.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-25 15-15-00"
    },
    {
      eventName: "Кенжаев Акмал Анварович Бойсун тумани ветеринария ва чорвачиликни ривожлантириш бўлими бошлиғи 01.06.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Кенжаев Акмал Анварович Бойсун тумани ветеринария ва чорвачиликни ривожлантириш бўлими бошлиғи 01.06.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-1 15-15-00"
    },
    {
      eventName: "Кенжаев Акмал Анварович Бойсун тумани ветеринария ва чорвачиликни ривожлантириш бўлими бошлиғи 01.06.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-1 15-15-00"
    },
    {
      eventName: "Кенжаев Акмал Анварович Бойсун тумани ветеринария ва чорвачиликни ривожлантириш бўлими бошлиғи 01.06.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-1 15-15-00"
    },
    {
      eventName: "Кенжаев Акмал Анварович Бойсун тумани ветеринария ва чорвачиликни ривожлантириш бўлими бошлиғи 01.06.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-1 15-15-00"
    },
    {
      eventName: "Ғиёсов Бахтиёр Қудратович Бойсун тумани ҳайвонлар касалликлари ва озиқ-овқат маҳсулотлари хавфсизлиги давлат маркази директори 01.06.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Ғиёсов Бахтиёр Қудратович Бойсун тумани ҳайвонлар касалликлари ва озиқ-овқат маҳсулотлари хавфсизлиги давлат маркази директори 01.06.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Ғиёсов Бахтиёр Қудратович Бойсун тумани ҳайвонлар касалликлари ва озиқ-овқат маҳсулотлари хавфсизлиги давлат маркази директори 01.06.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Ғиёсов Бахтиёр Қудратович Бойсун тумани ҳайвонлар касалликлари ва озиқ-овқат маҳсулотлари хавфсизлиги давлат маркази директори 01.06.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Ғиёсов Бахтиёр Қудратович Бойсун тумани ҳайвонлар касалликлари ва озиқ-овқат маҳсулотлари хавфсизлиги давлат маркази директори 01.06.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Фармонов Жамол Тошбоевич Бойсун тумани почта алока тармоғи бошлиғи 06.05.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-6 15-15-00"
    },
    {
      eventName: "Фармонов Жамол Тошбоевич Бойсун тумани почта алока тармоғи бошлиғи 06.05.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-6 15-15-00"
    },
    {
      eventName: "Фармонов Жамол Тошбоевич Бойсун тумани почта алока тармоғи бошлиғи 06.05.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-6 15-15-00"
    },
    {
      eventName: "Фармонов Жамол Тошбоевич Бойсун тумани почта алока тармоғи бошлиғи 06.05.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-6 15-15-00"
    },
    {
      eventName: "Фармонов Жамол Тошбоевич Бойсун тумани почта алока тармоғи бошлиғи 06.05.1976",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-6 15-15-00"
    },
    {
      eventName: "Останақулов Шамсиддин Нуриддинович Бойсун тумани “Бойсун” давлат ўрмон хўжалиги директори 09.02.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-9 15-15-00"
    },
    {
      eventName: "Останақулов Шамсиддин Нуриддинович Бойсун тумани “Бойсун” давлат ўрмон хўжалиги директори 09.02.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-9 15-15-00"
    },
    {
      eventName: "Останақулов Шамсиддин Нуриддинович Бойсун тумани “Бойсун” давлат ўрмон хўжалиги директори 09.02.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-9 15-15-00"
    },
    {
      eventName: "Останақулов Шамсиддин Нуриддинович Бойсун тумани “Бойсун” давлат ўрмон хўжалиги директори 09.02.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-9 15-15-00"
    },
    {
      eventName: "Останақулов Шамсиддин Нуриддинович Бойсун тумани “Бойсун” давлат ўрмон хўжалиги директори 09.02.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-9 15-15-00"
    },
    {
      eventName: "Маннонов Илҳом Замонович Бойсун тумани Давлат хизматлари кўрсатиш маркази директори 19.10.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-19 15-15-00"
    },
    {
      eventName: "Маннонов Илҳом Замонович Бойсун тумани Давлат хизматлари кўрсатиш маркази директори 19.10.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-19 15-15-00"
    },
    {
      eventName: "Маннонов Илҳом Замонович Бойсун тумани Давлат хизматлари кўрсатиш маркази директори 19.10.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-19 15-15-00"
    },
    {
      eventName: "Маннонов Илҳом Замонович Бойсун тумани Давлат хизматлари кўрсатиш маркази директори 19.10.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-19 15-15-00"
    },
    {
      eventName: "Маннонов Илҳом Замонович Бойсун тумани Давлат хизматлари кўрсатиш маркази директори 19.10.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-19 15-15-00"
    },
    {
      eventName: "Мамасолаев Бахриддин Хамроевич Бойсун тумани “Тангимуш Пайшанба” деҳқон бозори маъсулияти чекланган жамияти бошқаруви раиси 17.02.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-17 15-15-00"
    },
    {
      eventName: "Мамасолаев Бахриддин Хамроевич Бойсун тумани “Тангимуш Пайшанба” деҳқон бозори маъсулияти чекланган жамияти бошқаруви раиси 17.02.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-17 15-15-00"
    },
    {
      eventName: "Мамасолаев Бахриддин Хамроевич Бойсун тумани “Тангимуш Пайшанба” деҳқон бозори маъсулияти чекланган жамияти бошқаруви раиси 17.02.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-17 15-15-00"
    },
    {
      eventName: "Мамасолаев Бахриддин Хамроевич Бойсун тумани “Тангимуш Пайшанба” деҳқон бозори маъсулияти чекланган жамияти бошқаруви раиси 17.02.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-17 15-15-00"
    },
    {
      eventName: "Мамасолаев Бахриддин Хамроевич Бойсун тумани “Тангимуш Пайшанба” деҳқон бозори маъсулияти чекланган жамияти бошқаруви раиси 17.02.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-17 15-15-00"
    },
    {
      eventName: "Жўраев Мухриддин Холмуродович Бойсун тумани давлат кадастр хизмат бошлиғи 09.04.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-9 15-15-00"
    },
    {
      eventName: "Жўраев Мухриддин Холмуродович Бойсун тумани давлат кадастр хизмат бошлиғи 09.04.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-9 15-15-00"
    },
    {
      eventName: "Жўраев Мухриддин Холмуродович Бойсун тумани давлат кадастр хизмат бошлиғи 09.04.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-9 15-15-00"
    },
    {
      eventName: "Жўраев Мухриддин Холмуродович Бойсун тумани давлат кадастр хизмат бошлиғи 09.04.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-9 15-15-00"
    },
    {
      eventName: "Жўраев Мухриддин Холмуродович Бойсун тумани давлат кадастр хизмат бошлиғи 09.04.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-9 15-15-00"
    },
    {
      eventName: "Намозов Бахтиёр Чориевич Бойсун тумани ҳокимлиги ташкилий-назорат гуруҳи раҳбари 05.09.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-5 15-15-00"
    },
    {
      eventName: "Намозов Бахтиёр Чориевич Бойсун тумани ҳокимлиги ташкилий-назорат гуруҳи раҳбари 05.09.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-5 15-15-00"
    },
    {
      eventName: "Намозов Бахтиёр Чориевич Бойсун тумани ҳокимлиги ташкилий-назорат гуруҳи раҳбари 05.09.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-5 15-15-00"
    },
    {
      eventName: "Намозов Бахтиёр Чориевич Бойсун тумани ҳокимлиги ташкилий-назорат гуруҳи раҳбари 05.09.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-5 15-15-00"
    },
    {
      eventName: "Намозов Бахтиёр Чориевич Бойсун тумани ҳокимлиги ташкилий-назорат гуруҳи раҳбари 05.09.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-5 15-15-00"
    },
    {
      eventName: "Нормаматов Тўлқин Норбоевич Бойсун тумани ҳокимлиги девонхона мудири 07.04.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-7 15-15-00"
    },
    {
      eventName: "Нормаматов Тўлқин Норбоевич Бойсун тумани ҳокимлиги девонхона мудири 07.04.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-7 15-15-00"
    },
    {
      eventName: "Нормаматов Тўлқин Норбоевич Бойсун тумани ҳокимлиги девонхона мудири 07.04.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-7 15-15-00"
    },
    {
      eventName: "Нормаматов Тўлқин Норбоевич Бойсун тумани ҳокимлиги девонхона мудири 07.04.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-7 15-15-00"
    },
    {
      eventName: "Нормаматов Тўлқин Норбоевич Бойсун тумани ҳокимлиги девонхона мудири 07.04.1972",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-7 15-15-00"
    },
    {
      eventName: "Тоғаев Ойбек Рахматиллоевич Бойсун тумани ҳокими ёрдамчиси 02.04.1987",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-2 15-15-00"
    },
    {
      eventName: "Тоғаев Ойбек Рахматиллоевич Бойсун тумани ҳокими ёрдамчиси 02.04.1987",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-2 15-15-00"
    },
    {
      eventName: "Тоғаев Ойбек Рахматиллоевич Бойсун тумани ҳокими ёрдамчиси 02.04.1987",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-2 15-15-00"
    },
    {
      eventName: "Тоғаев Ойбек Рахматиллоевич Бойсун тумани ҳокими ёрдамчиси 02.04.1987",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-2 15-15-00"
    },
    {
      eventName: "Тоғаев Ойбек Рахматиллоевич Бойсун тумани ҳокими ёрдамчиси 02.04.1987",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-2 15-15-00"
    },
    {
      eventName: "Шоймардонов Фирўз Рахматиллаевич Бойсун тумани ҳокимлиги ҳузуридаги вояга етмаганлар ишлари бўйича туман идоралараро комиссияси масъул котиби 25.04.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-25 15-15-00"
    },
    {
      eventName: "Шоймардонов Фирўз Рахматиллаевич Бойсун тумани ҳокимлиги ҳузуридаги вояга етмаганлар ишлари бўйича туман идоралараро комиссияси масъул котиби 25.04.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-25 15-15-00"
    },
    {
      eventName: "Шоймардонов Фирўз Рахматиллаевич Бойсун тумани ҳокимлиги ҳузуридаги вояга етмаганлар ишлари бўйича туман идоралараро комиссияси масъул котиби 25.04.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-25 15-15-00"
    },
    {
      eventName: "Шоймардонов Фирўз Рахматиллаевич Бойсун тумани ҳокимлиги ҳузуридаги вояга етмаганлар ишлари бўйича туман идоралараро комиссияси масъул котиби 25.04.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-25 15-15-00"
    },
    {
      eventName: "Шоймардонов Фирўз Рахматиллаевич Бойсун тумани ҳокимлиги ҳузуридаги вояга етмаганлар ишлари бўйича туман идоралараро комиссияси масъул котиби 25.04.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-25 15-15-00"
    },
    {
      eventName: "Тошбоев Шуҳрат Исоевич Бойсун тумани ҳокимлиги бош ҳисобчиси 22.12.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-22 15-15-00"
    },
    {
      eventName: "Тошбоев Шуҳрат Исоевич Бойсун тумани ҳокимлиги бош ҳисобчиси 22.12.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-22 15-15-00"
    },
    {
      eventName: "Тошбоев Шуҳрат Исоевич Бойсун тумани ҳокимлиги бош ҳисобчиси 22.12.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-22 15-15-00"
    },
    {
      eventName: "Тошбоев Шуҳрат Исоевич Бойсун тумани ҳокимлиги бош ҳисобчиси 22.12.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-22 15-15-00"
    },
    {
      eventName: "Тошбоев Шуҳрат Исоевич Бойсун тумани ҳокимлиги бош ҳисобчиси 22.12.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-22 15-15-00"
    },
    {
      eventName: "Сафаров Беҳзод Ҳасанович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш мажмуаси бош мутахассиси 21.09.1988 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-21 15-15-00"
    },
    {
      eventName: "Сафаров Беҳзод Ҳасанович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш мажмуаси бош мутахассиси 21.09.1988 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-21 15-15-00"
    },
    {
      eventName: "Сафаров Беҳзод Ҳасанович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш мажмуаси бош мутахассиси 21.09.1988 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-21 15-15-00"
    },
    {
      eventName: "Сафаров Беҳзод Ҳасанович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш мажмуаси бош мутахассиси 21.09.1988 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-21 15-15-00"
    },
    {
      eventName: "Сафаров Беҳзод Ҳасанович Бойсун тумани ҳокимининг молия-иқтисодиёт ва камбағалликни қисқартириш мажмуаси бош мутахассиси 21.09.1988 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-21 15-15-00"
    },
    {
      eventName: "Азизов Оятулло Равшанович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик мажмуаси бош мутахассиси 20.11.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-20 15-15-00"
    },
    {
      eventName: "Азизов Оятулло Равшанович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик мажмуаси бош мутахассиси 20.11.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-20 15-15-00"
    },
    {
      eventName: "Азизов Оятулло Равшанович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик мажмуаси бош мутахассиси 20.11.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-20 15-15-00"
    },
    {
      eventName: "Азизов Оятулло Равшанович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик мажмуаси бош мутахассиси 20.11.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-20 15-15-00"
    },
    {
      eventName: "Азизов Оятулло Равшанович Бойсун тумани ҳокимининг саноатни ривожлантириш, капитал қурилиш, коммуникациялар ва коммунал хўжалик мажмуаси бош мутахассиси 20.11.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-20 15-15-00"
    },
    {
      eventName: "Акрамова Гулноза Маҳмудовна Бойсун тумани ҳокимлиги инвестициялар ва ташқи савдо мажмуаси бош мутахассиси 11.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-11 15-15-00"
    },
    {
      eventName: "Акрамова Гулноза Маҳмудовна Бойсун тумани ҳокимлиги инвестициялар ва ташқи савдо мажмуаси бош мутахассиси 11.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-11 15-15-00"
    },
    {
      eventName: "Акрамова Гулноза Маҳмудовна Бойсун тумани ҳокимлиги инвестициялар ва ташқи савдо мажмуаси бош мутахассиси 11.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-11 15-15-00"
    },
    {
      eventName: "Акрамова Гулноза Маҳмудовна Бойсун тумани ҳокимлиги инвестициялар ва ташқи савдо мажмуаси бош мутахассиси 11.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-11 15-15-00"
    },
    {
      eventName: "Акрамова Гулноза Маҳмудовна Бойсун тумани ҳокимлиги инвестициялар ва ташқи савдо мажмуаси бош мутахассиси 11.12.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-11 15-15-00"
    },
    {
      eventName: "Назаров Зайниддин Сайфиддинович Бойсун туман ҳокимлигининг қишлоқ ва сув хўжалиги масалалари мажмуаси бош мутахассиси  27.06.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-06-27 15-15-00"
    },
    {
      eventName: "Назаров Зайниддин Сайфиддинович Бойсун туман ҳокимлигининг қишлоқ ва сув хўжалиги масалалари мажмуаси бош мутахассиси  27.06.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-06-27 15-15-00"
    },
    {
      eventName: "Назаров Зайниддин Сайфиддинович Бойсун туман ҳокимлигининг қишлоқ ва сув хўжалиги масалалари мажмуаси бош мутахассиси  27.06.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-06-27 15-15-00"
    },
    {
      eventName: "Назаров Зайниддин Сайфиддинович Бойсун туман ҳокимлигининг қишлоқ ва сув хўжалиги масалалари мажмуаси бош мутахассиси  27.06.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-06-27 15-15-00"
    },
    {
      eventName: "Назаров Зайниддин Сайфиддинович Бойсун туман ҳокимлигининг қишлоқ ва сув хўжалиги масалалари мажмуаси бош мутахассиси  27.06.1989",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-06-27 15-15-00"
    },
    {
      eventName: "Нормаматов Хайрулло Жўрақулович Бойсун тумани инвестициялар ва ташқи савдо бўлими бошлиғи ўринбосари 29.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-29 15-15-00"
    },
    {
      eventName: "Нормаматов Хайрулло Жўрақулович Бойсун тумани инвестициялар ва ташқи савдо бўлими бошлиғи ўринбосари 29.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-29 15-15-00"
    },
    {
      eventName: "Нормаматов Хайрулло Жўрақулович Бойсун тумани инвестициялар ва ташқи савдо бўлими бошлиғи ўринбосари 29.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-29 15-15-00"
    },
    {
      eventName: "Нормаматов Хайрулло Жўрақулович Бойсун тумани инвестициялар ва ташқи савдо бўлими бошлиғи ўринбосари 29.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-29 15-15-00"
    },
    {
      eventName: "Нормаматов Хайрулло Жўрақулович Бойсун тумани инвестициялар ва ташқи савдо бўлими бошлиғи ўринбосари 29.01.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-29 15-15-00"
    },
    {
      eventName: "Сайдалиев Камолиддин Ҳасанович Бойсун тумани Ободонлаштириш бошқармаси мтахассиси 15.05.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-15 15-15-00"
    },
    {
      eventName: "Сайдалиев Камолиддин Ҳасанович Бойсун тумани Ободонлаштириш бошқармаси мтахассиси 15.05.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-15 15-15-00"
    },
    {
      eventName: "Сайдалиев Камолиддин Ҳасанович Бойсун тумани Ободонлаштириш бошқармаси мтахассиси 15.05.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-15 15-15-00"
    },
    {
      eventName: "Сайдалиев Камолиддин Ҳасанович Бойсун тумани Ободонлаштириш бошқармаси мтахассиси 15.05.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-15 15-15-00"
    },
    {
      eventName: "Сайдалиев Камолиддин Ҳасанович Бойсун тумани Ободонлаштириш бошқармаси мтахассиси 15.05.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-15 15-15-00"
    },
    {
      eventName: "Ашуров Комил Норбоевич  Бойсун тумани иқтисодий тараққиёт ва камбағалликни қисқартириш бўлими бошлиғининг ўринбосари 21.12.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-21 15-15-00"
    },
    {
      eventName: "Ашуров Комил Норбоевич  Бойсун тумани иқтисодий тараққиёт ва камбағалликни қисқартириш бўлими бошлиғининг ўринбосари 21.12.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-21 15-15-00"
    },
    {
      eventName: "Ашуров Комил Норбоевич  Бойсун тумани иқтисодий тараққиёт ва камбағалликни қисқартириш бўлими бошлиғининг ўринбосари 21.12.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-21 15-15-00"
    },
    {
      eventName: "Ашуров Комил Норбоевич  Бойсун тумани иқтисодий тараққиёт ва камбағалликни қисқартириш бўлими бошлиғининг ўринбосари 21.12.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-21 15-15-00"
    },
    {
      eventName: "Ашуров Комил Норбоевич  Бойсун тумани иқтисодий тараққиёт ва камбағалликни қисқартириш бўлими бошлиғининг ўринбосари 21.12.1965",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-21 15-15-00"
    },
    {
      eventName: "Жабборов Мухтор Мавлонович Бойсун тумани иқтисодиёт ва камбағалликни қисқартириш бўлими бош мутахассиси 18.02.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-18 15-15-00"
    },
    {
      eventName: "Жабборов Мухтор Мавлонович Бойсун тумани иқтисодиёт ва камбағалликни қисқартириш бўлими бош мутахассиси 18.02.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-18 15-15-00"
    },
    {
      eventName: "Жабборов Мухтор Мавлонович Бойсун тумани иқтисодиёт ва камбағалликни қисқартириш бўлими бош мутахассиси 18.02.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-18 15-15-00"
    },
    {
      eventName: "Жабборов Мухтор Мавлонович Бойсун тумани иқтисодиёт ва камбағалликни қисқартириш бўлими бош мутахассиси 18.02.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-18 15-15-00"
    },
    {
      eventName: "Жабборов Мухтор Мавлонович Бойсун тумани иқтисодиёт ва камбағалликни қисқартириш бўлими бош мутахассиси 18.02.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-18 15-15-00"
    },
    {
      eventName: "Эргашев Бекмурод Ахмедович  Бойсун туман халқ таълим бўлими мудирининг биринчи ўринбосари 12.09.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-12 15-15-00"
    },
    {
      eventName: "Эргашев Бекмурод Ахмедович  Бойсун туман халқ таълим бўлими мудирининг биринчи ўринбосари 12.09.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-12 15-15-00"
    },
    {
      eventName: "Эргашев Бекмурод Ахмедович  Бойсун туман халқ таълим бўлими мудирининг биринчи ўринбосари 12.09.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-12 15-15-00"
    },
    {
      eventName: "Эргашев Бекмурод Ахмедович  Бойсун туман халқ таълим бўлими мудирининг биринчи ўринбосари 12.09.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-12 15-15-00"
    },
    {
      eventName: "Эргашев Бекмурод Ахмедович  Бойсун туман халқ таълим бўлими мудирининг биринчи ўринбосари 12.09.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-12 15-15-00"
    },
    {
      eventName: "Муртазоев Тўлқин Ғаффорович Бойсун тумани Туризм ва спорт бўлими мутахассиси 04.05.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-4 15-15-00"
    },
    {
      eventName: "Муртазоев Тўлқин Ғаффорович Бойсун тумани Туризм ва спорт бўлими мутахассиси 04.05.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-4 15-15-00"
    },
    {
      eventName: "Муртазоев Тўлқин Ғаффорович Бойсун тумани Туризм ва спорт бўлими мутахассиси 04.05.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-4 15-15-00"
    },
    {
      eventName: "Муртазоев Тўлқин Ғаффорович Бойсун тумани Туризм ва спорт бўлими мутахассиси 04.05.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-4 15-15-00"
    },
    {
      eventName: "Муртазоев Тўлқин Ғаффорович Бойсун тумани Туризм ва спорт бўлими мутахассиси 04.05.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-4 15-15-00"
    },
    {
      eventName: "Тўрақулов Ғайрат Пўлатович Бойсун тумани телекоммуникация боғламаси 1-тоифали техниги 24.03.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-24 15-15-00"
    },
    {
      eventName: "Тўрақулов Ғайрат Пўлатович Бойсун тумани телекоммуникация боғламаси 1-тоифали техниги 24.03.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-24 15-15-00"
    },
    {
      eventName: "Тўрақулов Ғайрат Пўлатович Бойсун тумани телекоммуникация боғламаси 1-тоифали техниги 24.03.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-24 15-15-00"
    },
    {
      eventName: "Тўрақулов Ғайрат Пўлатович Бойсун тумани телекоммуникация боғламаси 1-тоифали техниги 24.03.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-24 15-15-00"
    },
    {
      eventName: "Тўрақулов Ғайрат Пўлатович Бойсун тумани телекоммуникация боғламаси 1-тоифали техниги 24.03.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-24 15-15-00"
    },
    {
      eventName: "Шукуров Сафар Шотўраевич Бойсун тумани “Ободонлаштириш” бошқармаси бош мухандиси 15.04.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-15 15-15-00"
    },
    {
      eventName: "Шукуров Сафар Шотўраевич Бойсун тумани “Ободонлаштириш” бошқармаси бош мухандиси 15.04.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-15 15-15-00"
    },
    {
      eventName: "Шукуров Сафар Шотўраевич Бойсун тумани “Ободонлаштириш” бошқармаси бош мухандиси 15.04.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-15 15-15-00"
    },
    {
      eventName: "Шукуров Сафар Шотўраевич Бойсун тумани “Ободонлаштириш” бошқармаси бош мухандиси 15.04.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-15 15-15-00"
    },
    {
      eventName: "Шукуров Сафар Шотўраевич Бойсун тумани “Ободонлаштириш” бошқармаси бош мухандиси 15.04.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-15 15-15-00"
    },
    {
      eventName: "Чоршанбиев Хидир Сувонович Пенсияда (меҳнат фахрийси) 28.04.1949",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-28 15-15-00"
    },
    {
      eventName: "Чоршанбиев Хидир Сувонович Пенсияда (меҳнат фахрийси) 28.04.1949",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-28 15-15-00"
    },
    {
      eventName: "Чоршанбиев Хидир Сувонович Пенсияда (меҳнат фахрийси) 28.04.1949",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-28 15-15-00"
    },
    {
      eventName: "Чоршанбиев Хидир Сувонович Пенсияда (меҳнат фахрийси) 28.04.1949",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-28 15-15-00"
    },
    {
      eventName: "Чоршанбиев Хидир Сувонович Пенсияда (меҳнат фахрийси) 28.04.1949",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-28 15-15-00"
    },
    {
      eventName: "Норқулов Абдулатиф Пенсияда (меҳнат фахрийси) 20.03.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-20 15-15-00"
    },
    {
      eventName: "Норқулов Абдулатиф Пенсияда (меҳнат фахрийси) 20.03.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-20 15-15-00"
    },
    {
      eventName: "Норқулов Абдулатиф Пенсияда (меҳнат фахрийси) 20.03.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-20 15-15-00"
    },
    {
      eventName: "Норқулов Абдулатиф Пенсияда (меҳнат фахрийси) 20.03.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-20 15-15-00"
    },
    {
      eventName: "Норқулов Абдулатиф Пенсияда (меҳнат фахрийси) 20.03.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-20 15-15-00"
    },
    {
      eventName: "Амиров Хуррам Пенсияда (меҳнат фахрийси)  26.07.1952",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-26 15-15-00"
    },
    {
      eventName: "Амиров Хуррам Пенсияда (меҳнат фахрийси)  26.07.1952",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-26 15-15-00"
    },
    {
      eventName: "Амиров Хуррам Пенсияда (меҳнат фахрийси)  26.07.1952",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-26 15-15-00"
    },
    {
      eventName: "Амиров Хуррам Пенсияда (меҳнат фахрийси)  26.07.1952",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-26 15-15-00"
    },
    {
      eventName: "Амиров Хуррам Пенсияда (меҳнат фахрийси)  26.07.1952",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-26 15-15-00"
    },
    {
      eventName: "Тўраев Эсан Пенсияда (меҳнат фахрийси) 15.02.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-15 15-15-00"
    },
    {
      eventName: "Тўраев Эсан Пенсияда (меҳнат фахрийси) 15.02.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-15 15-15-00"
    },
    {
      eventName: "Тўраев Эсан Пенсияда (меҳнат фахрийси) 15.02.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-15 15-15-00"
    },
    {
      eventName: "Тўраев Эсан Пенсияда (меҳнат фахрийси) 15.02.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-15 15-15-00"
    },
    {
      eventName: "Тўраев Эсан Пенсияда (меҳнат фахрийси) 15.02.1950",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-15 15-15-00"
    },
    {
      eventName: "Султонқулов Рўзибой Ортиқович Пенсияда (меҳнат фахрийси) 15.11.1947",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-15 15-15-00"
    },
    {
      eventName: "Султонқулов Рўзибой Ортиқович Пенсияда (меҳнат фахрийси) 15.11.1947",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-15 15-15-00"
    },
    {
      eventName: "Султонқулов Рўзибой Ортиқович Пенсияда (меҳнат фахрийси) 15.11.1947",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-15 15-15-00"
    },
    {
      eventName: "Султонқулов Рўзибой Ортиқович Пенсияда (меҳнат фахрийси) 15.11.1947",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-15 15-15-00"
    },
    {
      eventName: "Султонқулов Рўзибой Ортиқович Пенсияда (меҳнат фахрийси) 15.11.1947",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-15 15-15-00"
    },
    {
      eventName: "Рахимов Хаитмурот Пенсияда (меҳнат фахрийси) 05.07.1951",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-5   15-15-00"
    },
    {
      eventName: "Рахимов Хаитмурот Пенсияда (меҳнат фахрийси) 05.07.1951",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-5   15-15-00"
    },
    {
      eventName: "Рахимов Хаитмурот Пенсияда (меҳнат фахрийси) 05.07.1951",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-5   15-15-00"
    },
    {
      eventName: "Рахимов Хаитмурот Пенсияда (меҳнат фахрийси) 05.07.1951",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-5   15-15-00"
    },
    {
      eventName: "Рахимов Хаитмурот Пенсияда (меҳнат фахрийси) 05.07.1951",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-5   15-15-00"
    },
    {
      eventName: "Абдурохимов Норхидир Ахматович Пенсияда (меҳнат фахрийси) 15.08.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021 15-15-00"
    },
    {
      eventName: "Абдурохимов Норхидир Ахматович Пенсияда (меҳнат фахрийси) 15.08.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022 15-15-00"
    },
    {
      eventName: "Абдурохимов Норхидир Ахматович Пенсияда (меҳнат фахрийси) 15.08.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023 15-15-00"
    },
    {
      eventName: "Абдурохимов Норхидир Ахматович Пенсияда (меҳнат фахрийси) 15.08.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024 15-15-00"
    },
    {
      eventName: "Абдурохимов Норхидир Ахматович Пенсияда (меҳнат фахрийси) 15.08.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025 15-15-00"
    },
    {
      eventName: "Фармонов Чори Рахмонович Пенсияда (меҳнат фахрийси) 31.12.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-31 15-15-00"
    },
    {
      eventName: "Фармонов Чори Рахмонович Пенсияда (меҳнат фахрийси) 31.12.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-31 15-15-00"
    },
    {
      eventName: "Фармонов Чори Рахмонович Пенсияда (меҳнат фахрийси) 31.12.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-31 15-15-00"
    },
    {
      eventName: "Фармонов Чори Рахмонович Пенсияда (меҳнат фахрийси) 31.12.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-31 15-15-00"
    },
    {
      eventName: "Фармонов Чори Рахмонович Пенсияда (меҳнат фахрийси) 31.12.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-31 15-15-00"
    },
    {
      eventName: "Сатторова Алла Николаевна Пенсияда (меҳнат фахрийси) 17.03.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-17 15-15-00"
    },
    {
      eventName: "Сатторова Алла Николаевна Пенсияда (меҳнат фахрийси) 17.03.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-17 15-15-00"
    },
    {
      eventName: "Сатторова Алла Николаевна Пенсияда (меҳнат фахрийси) 17.03.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-17 15-15-00"
    },
    {
      eventName: "Сатторова Алла Николаевна Пенсияда (меҳнат фахрийси) 17.03.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-17 15-15-00"
    },
    {
      eventName: "Сатторова Алла Николаевна Пенсияда (меҳнат фахрийси) 17.03.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-17 15-15-00"
    },
    {
      eventName: "Маматқулов Омон Алимович Пенсияда (меҳнат фахрийси) 01.01.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-1 15-15-00"
    },
    {
      eventName: "Маматқулов Омон Алимович Пенсияда (меҳнат фахрийси) 01.01.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-1 15-15-00"
    },
    {
      eventName: "Маматқулов Омон Алимович Пенсияда (меҳнат фахрийси) 01.01.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-1 15-15-00"
    },
    {
      eventName: "Маматқулов Омон Алимович Пенсияда (меҳнат фахрийси) 01.01.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-1 15-15-00"
    },
    {
      eventName: "Маматқулов Омон Алимович Пенсияда (меҳнат фахрийси) 01.01.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-1 15-15-00"
    },
    {
      eventName: "Тошбоев Эшдавлат Чориевич Бойсун тумани Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи ўринбосари, «Нуронийлар» жамоатчилик Кенгаши раиси 18.02.1958",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-18 15-15-00"
    },
    {
      eventName: "Тошбоев Эшдавлат Чориевич Бойсун тумани Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи ўринбосари, «Нуронийлар» жамоатчилик Кенгаши раиси 18.02.1958",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-18 15-15-00"
    },
    {
      eventName: "Тошбоев Эшдавлат Чориевич Бойсун тумани Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи ўринбосари, «Нуронийлар» жамоатчилик Кенгаши раиси 18.02.1958",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-18 15-15-00"
    },
    {
      eventName: "Тошбоев Эшдавлат Чориевич Бойсун тумани Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи ўринбосари, «Нуронийлар» жамоатчилик Кенгаши раиси 18.02.1958",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-18 15-15-00"
    },
    {
      eventName: "Тошбоев Эшдавлат Чориевич Бойсун тумани Маҳалла ва оилани қўллаб-қувватлаш бўлими бошлиғи ўринбосари, «Нуронийлар» жамоатчилик Кенгаши раиси 18.02.1958",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-18 15-15-00"
    },
    {
      eventName: "Туробоев Музаффарбек Тоштемир ўғли Дзюдо бўйича Ўзбекистон ўсмирлар терма жамоаси аъзоси 05.04.2000 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-5 15-15-00"
    },
    {
      eventName: "Туробоев Музаффарбек Тоштемир ўғли Дзюдо бўйича Ўзбекистон ўсмирлар терма жамоаси аъзоси 05.04.2000 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-5 15-15-00"
    },
    {
      eventName: "Туробоев Музаффарбек Тоштемир ўғли Дзюдо бўйича Ўзбекистон ўсмирлар терма жамоаси аъзоси 05.04.2000 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-5 15-15-00"
    },
    {
      eventName: "Туробоев Музаффарбек Тоштемир ўғли Дзюдо бўйича Ўзбекистон ўсмирлар терма жамоаси аъзоси 05.04.2000 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-5 15-15-00"
    },
    {
      eventName: "Туробоев Музаффарбек Тоштемир ўғли Дзюдо бўйича Ўзбекистон ўсмирлар терма жамоаси аъзоси 05.04.2000 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-5 15-15-00"
    },
    {
      eventName: "Муртазоева Нигина Раҳмиддин қизи Бойсун тумани Болалар ўсмирлар спорт мактаби мураббийси 18.01.2001",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-18 15-15-00"
    },
    {
      eventName: "Муртазоева Нигина Раҳмиддин қизи Бойсун тумани Болалар ўсмирлар спорт мактаби мураббийси 18.01.2001",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-18 15-15-00"
    },
    {
      eventName: "Муртазоева Нигина Раҳмиддин қизи Бойсун тумани Болалар ўсмирлар спорт мактаби мураббийси 18.01.2001",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-18 15-15-00"
    },
    {
      eventName: "Муртазоева Нигина Раҳмиддин қизи Бойсун тумани Болалар ўсмирлар спорт мактаби мураббийси 18.01.2001",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-18 15-15-00"
    },
    {
      eventName: "Муртазоева Нигина Раҳмиддин қизи Бойсун тумани Болалар ўсмирлар спорт мактаби мураббийси 18.01.2001",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-18 15-15-00"
    },
    {
      eventName: "Тўрақулов Ёқуб Жабборович Бойсун тумани “Хуршид” кичик корхонаси бошлиғи 07.03.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-7 15-15-00"
    },
    {
      eventName: "Тўрақулов Ёқуб Жабборович Бойсун тумани “Хуршид” кичик корхонаси бошлиғи 07.03.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-7 15-15-00"
    },
    {
      eventName: "Тўрақулов Ёқуб Жабборович Бойсун тумани “Хуршид” кичик корхонаси бошлиғи 07.03.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-7 15-15-00"
    },
    {
      eventName: "Тўрақулов Ёқуб Жабборович Бойсун тумани “Хуршид” кичик корхонаси бошлиғи 07.03.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-7 15-15-00"
    },
    {
      eventName: "Тўрақулов Ёқуб Жабборович Бойсун тумани “Хуршид” кичик корхонаси бошлиғи 07.03.1959 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-7 15-15-00"
    },
    {
      eventName: "Абдуллаев Неъмат Ортиқович  Бойсун тумани “Умид” кичик корхонаси раҳбари 01.04.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-1 15-15-00"
    },
    {
      eventName: "Абдуллаев Неъмат Ортиқович  Бойсун тумани “Умид” кичик корхонаси раҳбари 01.04.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-1 15-15-00"
    },
    {
      eventName: "Абдуллаев Неъмат Ортиқович  Бойсун тумани “Умид” кичик корхонаси раҳбари 01.04.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-1 15-15-00"
    },
    {
      eventName: "Абдуллаев Неъмат Ортиқович  Бойсун тумани “Умид” кичик корхонаси раҳбари 01.04.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-1 15-15-00"
    },
    {
      eventName: "Абдуллаев Неъмат Ортиқович  Бойсун тумани “Умид” кичик корхонаси раҳбари 01.04.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-1 15-15-00"
    },
    {
      eventName: "Азизова Мафтуна Рахматулло қизи Бойсун тумани “Ҳунарманд” уюшмаси аъзоси, гиламдўз 27.08.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-27 15-15-00"
    },
    {
      eventName: "Азизова Мафтуна Рахматулло қизи Бойсун тумани “Ҳунарманд” уюшмаси аъзоси, гиламдўз 27.08.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-27 15-15-00"
    },
    {
      eventName: "Азизова Мафтуна Рахматулло қизи Бойсун тумани “Ҳунарманд” уюшмаси аъзоси, гиламдўз 27.08.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-27 15-15-00"
    },
    {
      eventName: "Азизова Мафтуна Рахматулло қизи Бойсун тумани “Ҳунарманд” уюшмаси аъзоси, гиламдўз 27.08.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-27 15-15-00"
    },
    {
      eventName: "Азизова Мафтуна Рахматулло қизи Бойсун тумани “Ҳунарманд” уюшмаси аъзоси, гиламдўз 27.08.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-27 15-15-00"
    },
    {
      eventName: "Алланов Ҳумойиддин Муҳиддин ўғли Бойсун тумани “Мухтадир ихтисос таъмир” хусусий фирмаси раҳбари 20.04.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-20 15-15-00"
    },
    {
      eventName: "Алланов Ҳумойиддин Муҳиддин ўғли Бойсун тумани “Мухтадир ихтисос таъмир” хусусий фирмаси раҳбари 20.04.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-20 15-15-00"
    },
    {
      eventName: "Алланов Ҳумойиддин Муҳиддин ўғли Бойсун тумани “Мухтадир ихтисос таъмир” хусусий фирмаси раҳбари 20.04.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-20 15-15-00"
    },
    {
      eventName: "Алланов Ҳумойиддин Муҳиддин ўғли Бойсун тумани “Мухтадир ихтисос таъмир” хусусий фирмаси раҳбари 20.04.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-20 15-15-00"
    },
    {
      eventName: "Алланов Ҳумойиддин Муҳиддин ўғли Бойсун тумани “Мухтадир ихтисос таъмир” хусусий фирмаси раҳбари 20.04.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-20 15-15-00"
    },
    {
      eventName: "Жўраева Нилуфар Давроновна Бойсун тумани “DREAM`S SHAHRINAZ” масъулияти чекланган жамияти директори 13.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-13 15-15-00"
    },
    {
      eventName: "Жўраева Нилуфар Давроновна Бойсун тумани “DREAM`S SHAHRINAZ” масъулияти чекланган жамияти директори 13.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-13 15-15-00"
    },
    {
      eventName: "Жўраева Нилуфар Давроновна Бойсун тумани “DREAM`S SHAHRINAZ” масъулияти чекланган жамияти директори 13.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-13 15-15-00"
    },
    {
      eventName: "Жўраева Нилуфар Давроновна Бойсун тумани “DREAM`S SHAHRINAZ” масъулияти чекланган жамияти директори 13.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-13 15-15-00"
    },
    {
      eventName: "Жўраева Нилуфар Давроновна Бойсун тумани “DREAM`S SHAHRINAZ” масъулияти чекланган жамияти директори 13.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-13 15-15-00"
    },
    {
      eventName: "Маматов Бахриддин Бўриевич Бойсун тумани “Жило Файз” хусусий корхонаси бошлиғи 30.07.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-30 15-15-00"
    },
    {
      eventName: "Маматов Бахриддин Бўриевич Бойсун тумани “Жило Файз” хусусий корхонаси бошлиғи 30.07.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-30 15-15-00"
    },
    {
      eventName: "Маматов Бахриддин Бўриевич Бойсун тумани “Жило Файз” хусусий корхонаси бошлиғи 30.07.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-30 15-15-00"
    },
    {
      eventName: "Маматов Бахриддин Бўриевич Бойсун тумани “Жило Файз” хусусий корхонаси бошлиғи 30.07.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-30 15-15-00"
    },
    {
      eventName: "Маматов Бахриддин Бўриевич Бойсун тумани “Жило Файз” хусусий корхонаси бошлиғи 30.07.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-30 15-15-00"
    },
    {
      eventName: "Қодиров Бехзод Нормаматович Бойсун тумани “Нарзи қушбеги” хусусий кичик корхонаси бошлиғи 12.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-12 15-15-00"
    },
    {
      eventName: "Қодиров Бехзод Нормаматович Бойсун тумани “Нарзи қушбеги” хусусий кичик корхонаси бошлиғи 12.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-12 15-15-00"
    },
    {
      eventName: "Қодиров Бехзод Нормаматович Бойсун тумани “Нарзи қушбеги” хусусий кичик корхонаси бошлиғи 12.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-12 15-15-00"
    },
    {
      eventName: "Қодиров Бехзод Нормаматович Бойсун тумани “Нарзи қушбеги” хусусий кичик корхонаси бошлиғи 12.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-12 15-15-00"
    },
    {
      eventName: "Қодиров Бехзод Нормаматович Бойсун тумани “Нарзи қушбеги” хусусий кичик корхонаси бошлиғи 12.03.1983",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-12 15-15-00"
    },
    {
      eventName: "Сафаров Бехзод Абдусаломович Бойсун тумани “Бойсун Бунёдкори” хусусий корхонаси директори 16.01.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-16 15-15-00"
    },
    {
      eventName: "Сафаров Бехзод Абдусаломович Бойсун тумани “Бойсун Бунёдкори” хусусий корхонаси директори 16.01.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-16 15-15-00"
    },
    {
      eventName: "Сафаров Бехзод Абдусаломович Бойсун тумани “Бойсун Бунёдкори” хусусий корхонаси директори 16.01.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-16 15-15-00"
    },
    {
      eventName: "Сафаров Бехзод Абдусаломович Бойсун тумани “Бойсун Бунёдкори” хусусий корхонаси директори 16.01.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-16 15-15-00"
    },
    {
      eventName: "Сафаров Бехзод Абдусаломович Бойсун тумани “Бойсун Бунёдкори” хусусий корхонаси директори 16.01.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-16 15-15-00"
    },
    {
      eventName: "Орипов Пиримқул Нормуродович Бойсун тумани “Орипов Нормурод” фермер хўжалиги бошлиғи  10.05.1960 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-10 15-15-00"
    },
    {
      eventName: "Орипов Пиримқул Нормуродович Бойсун тумани “Орипов Нормурод” фермер хўжалиги бошлиғи  10.05.1960 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-10 15-15-00"
    },
    {
      eventName: "Орипов Пиримқул Нормуродович Бойсун тумани “Орипов Нормурод” фермер хўжалиги бошлиғи  10.05.1960 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-10 15-15-00"
    },
    {
      eventName: "Орипов Пиримқул Нормуродович Бойсун тумани “Орипов Нормурод” фермер хўжалиги бошлиғи  10.05.1960 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-10 15-15-00"
    },
    {
      eventName: "Орипов Пиримқул Нормуродович Бойсун тумани “Орипов Нормурод” фермер хўжалиги бошлиғи  10.05.1960 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-10 15-15-00"
    },
    {
      eventName: "Жўрақулов Норқул Турдиевич Бойсун тумани “Турди Жўрақул” фермер хўжалиги бошлиғи 02.02.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-2 15-15-00"
    },
    {
      eventName: "Жўрақулов Норқул Турдиевич Бойсун тумани “Турди Жўрақул” фермер хўжалиги бошлиғи 02.02.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-2 15-15-00"
    },
    {
      eventName: "Жўрақулов Норқул Турдиевич Бойсун тумани “Турди Жўрақул” фермер хўжалиги бошлиғи 02.02.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-2 15-15-00"
    },
    {
      eventName: "Жўрақулов Норқул Турдиевич Бойсун тумани “Турди Жўрақул” фермер хўжалиги бошлиғи 02.02.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-2 15-15-00"
    },
    {
      eventName: "Жўрақулов Норқул Турдиевич Бойсун тумани “Турди Жўрақул” фермер хўжалиги бошлиғи 02.02.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-2 15-15-00"
    },
    {
      eventName: "Темиров Ажрулло Ҳикматович Бойсун тумани “Қадр-қаноат” фермер хўжалиги бошлиғи 20.02.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-20 15-15-00"
    },
    {
      eventName: "Темиров Ажрулло Ҳикматович Бойсун тумани “Қадр-қаноат” фермер хўжалиги бошлиғи 20.02.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-20 15-15-00"
    },
    {
      eventName: "Темиров Ажрулло Ҳикматович Бойсун тумани “Қадр-қаноат” фермер хўжалиги бошлиғи 20.02.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-20 15-15-00"
    },
    {
      eventName: "Темиров Ажрулло Ҳикматович Бойсун тумани “Қадр-қаноат” фермер хўжалиги бошлиғи 20.02.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-20 15-15-00"
    },
    {
      eventName: "Темиров Ажрулло Ҳикматович Бойсун тумани “Қадр-қаноат” фермер хўжалиги бошлиғи 20.02.1993 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-20 15-15-00"
    },
    {
      eventName: "Жуммаев Бўриқул Ўроқович Бойсун тумани Маданият бўлимига қарашли “Даштиғоз” маданият маркази тўгарак раҳбари 03.03.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-3 15-15-00"
    },
    {
      eventName: "Жуммаев Бўриқул Ўроқович Бойсун тумани Маданият бўлимига қарашли “Даштиғоз” маданият маркази тўгарак раҳбари 03.03.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-3 15-15-00"
    },
    {
      eventName: "Жуммаев Бўриқул Ўроқович Бойсун тумани Маданият бўлимига қарашли “Даштиғоз” маданият маркази тўгарак раҳбари 03.03.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-3 15-15-00"
    },
    {
      eventName: "Жуммаев Бўриқул Ўроқович Бойсун тумани Маданият бўлимига қарашли “Даштиғоз” маданият маркази тўгарак раҳбари 03.03.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-3 15-15-00"
    },
    {
      eventName: "Жуммаев Бўриқул Ўроқович Бойсун тумани Маданият бўлимига қарашли “Даштиғоз” маданият маркази тўгарак раҳбари 03.03.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-3 15-15-00"
    },
    {
      eventName: "Рахимов Ўрал Маликович Бойсун тумани 6-Болалар мусиқа ва санъат мактаби бахшичилик ўқитувчиси 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-3 15-15-00"
    },
    {
      eventName: "Рахимов Ўрал Маликович Бойсун тумани 6-Болалар мусиқа ва санъат мактаби бахшичилик ўқитувчиси 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-3 15-15-00"
    },
    {
      eventName: "Рахимов Ўрал Маликович Бойсун тумани 6-Болалар мусиқа ва санъат мактаби бахшичилик ўқитувчиси 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-3 15-15-00"
    },
    {
      eventName: "Рахимов Ўрал Маликович Бойсун тумани 6-Болалар мусиқа ва санъат мактаби бахшичилик ўқитувчиси 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-3 15-15-00"
    },
    {
      eventName: "Рахимов Ўрал Маликович Бойсун тумани 6-Болалар мусиқа ва санъат мактаби бахшичилик ўқитувчиси 03.02.1968",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-3 15-15-00"
    },
    {
      eventName: "Болтаев Камолиддин Жўрақулович Бойсун тумани “Ариқ-усти” маҳалла фуқаролар йиғини раиси 24.05.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-24 15-15-00"
    },
    {
      eventName: "Болтаев Камолиддин Жўрақулович Бойсун тумани “Ариқ-усти” маҳалла фуқаролар йиғини раиси 24.05.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-24 15-15-00"
    },
    {
      eventName: "Болтаев Камолиддин Жўрақулович Бойсун тумани “Ариқ-усти” маҳалла фуқаролар йиғини раиси 24.05.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-24 15-15-00"
    },
    {
      eventName: "Болтаев Камолиддин Жўрақулович Бойсун тумани “Ариқ-усти” маҳалла фуқаролар йиғини раиси 24.05.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-24 15-15-00"
    },
    {
      eventName: "Болтаев Камолиддин Жўрақулович Бойсун тумани “Ариқ-усти” маҳалла фуқаролар йиғини раиси 24.05.1973",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-24 15-15-00"
    },
    {
      eventName: "Каримов Жўрабек Набиевич Бойсун тумани  “Газа” маҳалла фуқаролар йиғини раиси 29.12.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-29 15-15-00"
    },
    {
      eventName: "Каримов Жўрабек Набиевич Бойсун тумани  “Газа” маҳалла фуқаролар йиғини раиси 29.12.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-29 15-15-00"
    },
    {
      eventName: "Каримов Жўрабек Набиевич Бойсун тумани  “Газа” маҳалла фуқаролар йиғини раиси 29.12.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-29 15-15-00"
    },
    {
      eventName: "Каримов Жўрабек Набиевич Бойсун тумани  “Газа” маҳалла фуқаролар йиғини раиси 29.12.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-29 15-15-00"
    },
    {
      eventName: "Каримов Жўрабек Набиевич Бойсун тумани  “Газа” маҳалла фуқаролар йиғини раиси 29.12.1985",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-29 15-15-00"
    },
    {
      eventName: "Худоёров Бозор Хўжамович Бойсун тумани “Бошработ” маҳалла фуқаролар йиғини раиси 22.09.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-22 15-15-00"
    },
    {
      eventName: "Худоёров Бозор Хўжамович Бойсун тумани “Бошработ” маҳалла фуқаролар йиғини раиси 22.09.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-22 15-15-00"
    },
    {
      eventName: "Худоёров Бозор Хўжамович Бойсун тумани “Бошработ” маҳалла фуқаролар йиғини раиси 22.09.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-22 15-15-00"
    },
    {
      eventName: "Худоёров Бозор Хўжамович Бойсун тумани “Бошработ” маҳалла фуқаролар йиғини раиси 22.09.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-22 15-15-00"
    },
    {
      eventName: "Худоёров Бозор Хўжамович Бойсун тумани “Бошработ” маҳалла фуқаролар йиғини раиси 22.09.1960",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-22 15-15-00"
    },
    {
      eventName: "Аллаёров Мусулмон Эшмўминович Бойсун тумани “Шифобулоқ” маҳалла фуқаролар йиғини раиси  20.07.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-20 15-15-00"
    },
    {
      eventName: "Аллаёров Мусулмон Эшмўминович Бойсун тумани “Шифобулоқ” маҳалла фуқаролар йиғини раиси  20.07.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-20 15-15-00"
    },
    {
      eventName: "Аллаёров Мусулмон Эшмўминович Бойсун тумани “Шифобулоқ” маҳалла фуқаролар йиғини раиси  20.07.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-20 15-15-00"
    },
    {
      eventName: "Аллаёров Мусулмон Эшмўминович Бойсун тумани “Шифобулоқ” маҳалла фуқаролар йиғини раиси  20.07.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-20 15-15-00"
    },
    {
      eventName: "Аллаёров Мусулмон Эшмўминович Бойсун тумани “Шифобулоқ” маҳалла фуқаролар йиғини раиси  20.07.1985 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-20 15-15-00"
    },
    {
      eventName: "Муродов Абдуқодир Равшанович Бойсун тумани “Меҳриобод” маҳалла фуқаролар йиғини раиси 04.04.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-4 15-15-00"
    },
    {
      eventName: "Муродов Абдуқодир Равшанович Бойсун тумани “Меҳриобод” маҳалла фуқаролар йиғини раиси 04.04.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-4 15-15-00"
    },
    {
      eventName: "Муродов Абдуқодир Равшанович Бойсун тумани “Меҳриобод” маҳалла фуқаролар йиғини раиси 04.04.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-4 15-15-00"
    },
    {
      eventName: "Муродов Абдуқодир Равшанович Бойсун тумани “Меҳриобод” маҳалла фуқаролар йиғини раиси 04.04.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-4 15-15-00"
    },
    {
      eventName: "Муродов Абдуқодир Равшанович Бойсун тумани “Меҳриобод” маҳалла фуқаролар йиғини раиси 04.04.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-4 15-15-00"
    },
    {
      eventName: "Йўлдошев Ғаффор Сатторович Бойсун тумани “Кўчкак” маҳалла фуқаролар йиғини раиси 29.08.1961",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-29 15-15-00"
    },
    {
      eventName: "Йўлдошев Ғаффор Сатторович Бойсун тумани “Кўчкак” маҳалла фуқаролар йиғини раиси 29.08.1961",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-29 15-15-00"
    },
    {
      eventName: "Йўлдошев Ғаффор Сатторович Бойсун тумани “Кўчкак” маҳалла фуқаролар йиғини раиси 29.08.1961",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-29 15-15-00"
    },
    {
      eventName: "Йўлдошев Ғаффор Сатторович Бойсун тумани “Кўчкак” маҳалла фуқаролар йиғини раиси 29.08.1961",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-29 15-15-00"
    },
    {
      eventName: "Йўлдошев Ғаффор Сатторович Бойсун тумани “Кўчкак” маҳалла фуқаролар йиғини раиси 29.08.1961",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-29 15-15-00"
    },
    {
      eventName: "Худойкулов Саттор Туробович Бойсун тумани “Ҳунармандлар” маҳалла фуқаролар йиғини раиси 15.01.1967 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-15 15-15-00"
    },
    {
      eventName: "Худойкулов Саттор Туробович Бойсун тумани “Ҳунармандлар” маҳалла фуқаролар йиғини раиси 15.01.1967 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-15 15-15-00"
    },
    {
      eventName: "Худойкулов Саттор Туробович Бойсун тумани “Ҳунармандлар” маҳалла фуқаролар йиғини раиси 15.01.1967 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-15 15-15-00"
    },
    {
      eventName: "Худойкулов Саттор Туробович Бойсун тумани “Ҳунармандлар” маҳалла фуқаролар йиғини раиси 15.01.1967 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-15 15-15-00"
    },
    {
      eventName: "Худойкулов Саттор Туробович Бойсун тумани “Ҳунармандлар” маҳалла фуқаролар йиғини раиси 15.01.1967 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-15 15-15-00"
    },
    {
      eventName: "Бозоров Наим Нуриддинович Бойсун тумани “Бибиширин” маҳалла фуқаролар йиғини раиси 10.04.1971 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-10 15-15-00"
    },
    {
      eventName: "Бозоров Наим Нуриддинович Бойсун тумани “Бибиширин” маҳалла фуқаролар йиғини раиси 10.04.1971 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-10 15-15-00"
    },
    {
      eventName: "Бозоров Наим Нуриддинович Бойсун тумани “Бибиширин” маҳалла фуқаролар йиғини раиси 10.04.1971 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-10 15-15-00"
    },
    {
      eventName: "Бозоров Наим Нуриддинович Бойсун тумани “Бибиширин” маҳалла фуқаролар йиғини раиси 10.04.1971 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-10 15-15-00"
    },
    {
      eventName: "Бозоров Наим Нуриддинович Бойсун тумани “Бибиширин” маҳалла фуқаролар йиғини раиси 10.04.1971 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-10 15-15-00"
    },
    {
      eventName: "Эсанова Дилдора Олимжоновна Бойсун тумани 2-сон касб-ҳунар мактаби ёшлар еткачиси 07.04.1997 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-7 15-15-00"
    },
    {
      eventName: "Эсанова Дилдора Олимжоновна Бойсун тумани 2-сон касб-ҳунар мактаби ёшлар еткачиси 07.04.1997 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-7 15-15-00"
    },
    {
      eventName: "Эсанова Дилдора Олимжоновна Бойсун тумани 2-сон касб-ҳунар мактаби ёшлар еткачиси 07.04.1997 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-7 15-15-00"
    },
    {
      eventName: "Эсанова Дилдора Олимжоновна Бойсун тумани 2-сон касб-ҳунар мактаби ёшлар еткачиси 07.04.1997 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-7 15-15-00"
    },
    {
      eventName: "Эсанова Дилдора Олимжоновна Бойсун тумани 2-сон касб-ҳунар мактаби ёшлар еткачиси 07.04.1997 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-7 15-15-00"
    },
    {
      eventName: "Мирзаев Бунёд Рофи ўғли Бойсун тумани 3-сон умумтаълим мактаби ёшлар еткачиси 15.05.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-15 15-15-00"
    },
    {
      eventName: "Мирзаев Бунёд Рофи ўғли Бойсун тумани 3-сон умумтаълим мактаби ёшлар еткачиси 15.05.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-15 15-15-00"
    },
    {
      eventName: "Мирзаев Бунёд Рофи ўғли Бойсун тумани 3-сон умумтаълим мактаби ёшлар еткачиси 15.05.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-15 15-15-00"
    },
    {
      eventName: "Мирзаев Бунёд Рофи ўғли Бойсун тумани 3-сон умумтаълим мактаби ёшлар еткачиси 15.05.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-15 15-15-00"
    },
    {
      eventName: "Мирзаев Бунёд Рофи ўғли Бойсун тумани 3-сон умумтаълим мактаби ёшлар еткачиси 15.05.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-15 15-15-00"
    },
    {
      eventName: "Неъматуллаев Акбар Эркин ўғли Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 15.10.1992",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-15 15-15-00"
    },
    {
      eventName: "Неъматуллаев Акбар Эркин ўғли Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 15.10.1992",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-15 15-15-00"
    },
    {
      eventName: "Неъматуллаев Акбар Эркин ўғли Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 15.10.1992",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-15 15-15-00"
    },
    {
      eventName: "Неъматуллаев Акбар Эркин ўғли Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 15.10.1992",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-15 15-15-00"
    },
    {
      eventName: "Неъматуллаев Акбар Эркин ўғли Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 15.10.1992",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-15 15-15-00"
    },
    {
      eventName: "Нормаматов Феруз Бахтиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 09.01.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-9 15-15-00"
    },
    {
      eventName: "Нормаматов Феруз Бахтиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 09.01.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-9 15-15-00"
    },
    {
      eventName: "Нормаматов Феруз Бахтиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 09.01.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-9 15-15-00"
    },
    {
      eventName: "Нормаматов Феруз Бахтиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 09.01.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-9 15-15-00"
    },
    {
      eventName: "Нормаматов Феруз Бахтиёрович Ўзбекистон Республикаси Ёшлар ишлари агентлиги Бойсун тумани бўлими бош мутахассиси 09.01.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-9 15-15-00"
    },
    {
      eventName: "Абдиев Санжар Собир ўғли Бойсун тумани “IT маркази” раҳбари  04.04.1991 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-4 15-15-00"
    },
    {
      eventName: "Абдиев Санжар Собир ўғли  Бойсун тумани “IT маркази” раҳбари 04.04.1991 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-4 15-15-00"
    },
    {
      eventName: "Абдиев Санжар Собир ўғли Бойсун тумани “IT маркази” раҳбари 04.04.1991 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-4 15-15-00"
    },
    {
      eventName: "Абдиев Санжар Собир ўғли Бойсун тумани “IT маркази” раҳбари 04.04.1991 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-4 15-15-00"
    },
    {
      eventName: "Абдиев Санжар Собир ўғли Бойсун тумани “IT маркази” раҳбари 04.04.1991 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-4 15-15-00"
    },
    {
      eventName: "Бўриева Мунира Норқуловна Бойсун тумани 1-сон умумтаълим мактаби ёшлар еткачиси 06.06.1994 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-6 15-15-00"
    },
    {
      eventName: "Бўриева Мунира НорқуловнаБойсун тумани 1-сон умумтаълим мактаби ёшлар еткачиси 06.06.1994 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-6 15-15-00"
    },
    {
      eventName: "Бўриева Мунира НорқуловнаБойсун тумани 1-сон умумтаълим мактаби ёшлар еткачиси 06.06.1994 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-6 15-15-00"
    },
    {
      eventName: "Бўриева Мунира НорқуловнаБойсун тумани 1-сон умумтаълим мактаби ёшлар еткачиси 06.06.1994 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-6 15-15-00"
    },
    {
      eventName: "Бўриева Мунира Норқуловна Бойсун тумани 1-сон умумтаълим мактаби ёшлар еткачиси 06.06.1994 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-6 15-15-00"
    },
    {
      eventName: "Жаъфаров Отабек Ойбекович Бойсун тумани 5-сон умумтаълим мактаби ёшлар еткачиси 27.11.1996",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-27 15-15-00"
    },
    {
      eventName: "Жаъфаров Отабек Ойбекович Бойсун тумани 5-сон умумтаълим мактаби ёшлар еткачиси 27.11.1996",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-27 15-15-00"
    },
    {
      eventName: "Жаъфаров Отабек Ойбекович Бойсун тумани 5-сон умумтаълим мактаби ёшлар еткачиси 27.11.1996",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-27 15-15-00"
    },
    {
      eventName: "Жаъфаров Отабек Ойбекович Бойсун тумани 5-сон умумтаълим мактаби ёшлар еткачиси 27.11.1996",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-27 15-15-00"
    },
    {
      eventName: "Жаъфаров Отабек Ойбекович Бойсун тумани 5-сон умумтаълим мактаби ёшлар еткачиси 27.11.1996",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-27 15-15-00"
    },
    {
      eventName: "Атоев Нурали Зойирович Бойсун тумани 22-сон умумтаълим мактаби ёшлар еткачиси 27.03.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-27 15-15-00"
    },
    {
      eventName: "Атоев Нурали Зойирович Бойсун тумани 22-сон умумтаълим мактаби ёшлар еткачиси 27.03.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-27 15-15-00"
    },
    {
      eventName: "Атоев Нурали Зойирович Бойсун тумани 22-сон умумтаълим мактаби ёшлар еткачиси 27.03.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-27 15-15-00"
    },
    {
      eventName: "Атоев Нурали Зойирович Бойсун тумани 22-сон умумтаълим мактаби ёшлар еткачиси 27.03.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-27 15-15-00"
    },
    {
      eventName: "Атоев Нурали Зойирович Бойсун тумани 22-сон умумтаълим мактаби ёшлар еткачиси 27.03.1990 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-27 15-15-00"
    },
    {
      eventName: "Ҳусанов Абдумалик Абдурасулович Бойсун тумани 27-сон умумтаълим мактаби ёшлар еткачиси 23.10.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021 15-15-00"
    },
    {
      eventName: "Ҳусанов Абдумалик Абдурасулович Бойсун тумани 27-сон умумтаълим мактаби ёшлар еткачиси 23.10.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022 15-15-00"
    },
    {
      eventName: "Ҳусанов Абдумалик Абдурасулович Бойсун тумани 27-сон умумтаълим мактаби ёшлар еткачиси 23.10.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023 15-15-00"
    },
    {
      eventName: "Ҳусанов Абдумалик Абдурасулович Бойсун тумани 27-сон умумтаълим мактаби ёшлар еткачиси 23.10.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024 15-15-00"
    },
    {
      eventName: "Ҳусанов Абдумалик Абдурасулович Бойсун тумани 27-сон умумтаълим мактаби ёшлар еткачиси 23.10.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025 15-15-00"
    },
    {
      eventName: "Мажидов Шамсуллоҳ Раҳматуллоевич Бойсун тумани 33-сон умумтаълим мактаби ёшлар еткачиси 01.06.1995 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-1 15-15-00"
    },
    {
      eventName: "Мажидов Шамсуллоҳ Раҳматуллоевич Бойсун тумани 33-сон умумтаълим мактаби ёшлар еткачиси 01.06.1995 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-1 15-15-00"
    },
    {
      eventName: "Мажидов Шамсуллоҳ Раҳматуллоевич Бойсун тумани 33-сон умумтаълим мактаби ёшлар еткачиси 01.06.1995 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-1 15-15-00"
    },
    {
      eventName: "Мажидов Шамсуллоҳ Раҳматуллоевич Бойсун тумани 33-сон умумтаълим мактаби ёшлар еткачиси 01.06.1995 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-1 15-15-00"
    },
    {
      eventName: "Мажидов Шамсуллоҳ Раҳматуллоевич Бойсун тумани 33-сон умумтаълим мактаби ёшлар еткачиси 01.06.1995 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-1 15-15-00"
    },
    {
      eventName: "Холназаров Шароф Хурам ўғли Бойсун тумани 55-сон умумтаълим мактаби ёшлар еткачиси 09.01.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-9 15-15-00"
    },
    {
      eventName: "Холназаров Шароф Хурам ўғли Бойсун тумани 55-сон умумтаълим мактаби ёшлар еткачиси 09.01.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-9 15-15-00"
    },
    {
      eventName: "Холназаров Шароф Хурам ўғли Бойсун тумани 55-сон умумтаълим мактаби ёшлар еткачиси 09.01.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-9 15-15-00"
    },
    {
      eventName: "Холназаров Шароф Хурам ўғли Бойсун тумани 55-сон умумтаълим мактаби ёшлар еткачиси 09.01.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-9 15-15-00"
    },
    {
      eventName: "Холназаров Шароф Хурам ўғли Бойсун тумани 55-сон умумтаълим мактаби ёшлар еткачиси 09.01.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-9 15-15-00"
    },
    {
      eventName: "Жанаев Бунёд Тохирович Бойсун тумани 1-сон касб-ҳунар мактаби ўқитувчиси 06.04.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-6 15-15-00"
    },
    {
      eventName: "Жанаев Бунёд Тохирович Бойсун тумани 1-сон касб-ҳунар мактаби ўқитувчиси 06.04.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-6 15-15-00"
    },
    {
      eventName: "Жанаев Бунёд Тохирович Бойсун тумани 1-сон касб-ҳунар мактаби ўқитувчиси 06.04.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-6 15-15-00"
    },
    {
      eventName: "Жанаев Бунёд Тохирович Бойсун тумани 1-сон касб-ҳунар мактаби ўқитувчиси 06.04.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-6 15-15-00"
    },
    {
      eventName: "Жанаев Бунёд Тохирович Бойсун тумани 1-сон касб-ҳунар мактаби ўқитувчиси 06.04.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-6 15-15-00"
    },
    {
      eventName: "Қулматов Аббос Ашурович Бойсун тумани телекоммуникация боғламаси мижозларга хизмат курсатиш савдо офиси техниги 02.09.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-9-2 15-15-00"
    },
    {
      eventName: "Қулматов Аббос Ашурович Бойсун тумани телекоммуникация боғламаси мижозларга хизмат курсатиш савдо офиси техниги 02.09.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-9-2 15-15-00"
    },
    {
      eventName: "Қулматов Аббос Ашурович Бойсун тумани телекоммуникация боғламаси мижозларга хизмат курсатиш савдо офиси техниги 02.09.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-9-2 15-15-00"
    },
    {
      eventName: "Қулматов Аббос Ашурович Бойсун тумани телекоммуникация боғламаси мижозларга хизмат курсатиш савдо офиси техниги 02.09.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-9-2 15-15-00"
    },
    {
      eventName: "Қулматов Аббос Ашурович Бойсун тумани телекоммуникация боғламаси мижозларга хизмат курсатиш савдо офиси техниги 02.09.1994",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-9-2 15-15-00"
    },
    {
      eventName: "Рустамов Шаҳзод Иззатуллаевич Бойсун тумани “Ўрмончи” МФЙ ёрдамчи инспектори 15.10.1997",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-15 15-15-00"
    },
    {
      eventName: "Рустамов Шаҳзод Иззатуллаевич Бойсун тумани “Ўрмончи” МФЙ ёрдамчи инспектори 15.10.1997",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-15 15-15-00"
    },
    {
      eventName: "Рустамов Шаҳзод Иззатуллаевич Бойсун тумани “Ўрмончи” МФЙ ёрдамчи инспектори 15.10.1997",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-15 15-15-00"
    },
    {
      eventName: "Рустамов Шаҳзод Иззатуллаевич Бойсун тумани “Ўрмончи” МФЙ ёрдамчи инспектори 15.10.1997",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-15 15-15-00"
    },
    {
      eventName: "Рустамов Шаҳзод Иззатуллаевич Бойсун тумани “Ўрмончи” МФЙ ёрдамчи инспектори 15.10.1997",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-15 15-15-00"
    },
    {
      eventName: "Ҳамроева Зебинисо Холмаматовна Бойсун тумани 2-сон умумтаълим мактаби ўқитувчиси 02.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-2 15-15-00"
    },
    {
      eventName: "Ҳамроева Зебинисо Холмаматовна Бойсун тумани 2-сон умумтаълим мактаби ўқитувчиси 02.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-2 15-15-00"
    },
    {
      eventName: "Ҳамроева Зебинисо Холмаматовна Бойсун тумани 2-сон умумтаълим мактаби ўқитувчиси 02.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-2 15-15-00"
    },
    {
      eventName: "Ҳамроева Зебинисо Холмаматовна Бойсун тумани 2-сон умумтаълим мактаби ўқитувчиси 02.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-2 15-15-00"
    },
    {
      eventName: "Ҳамроева Зебинисо Холмаматовна Бойсун тумани 2-сон умумтаълим мактаби ўқитувчиси 02.01.1984",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-2 15-15-00"
    },
    {
      eventName: "Туробова Нилуфар Умедуллаевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директор ўринбосари 04.06.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-4 15-15-00"
    },
    {
      eventName: "Туробова Нилуфар Умедуллаевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директор ўринбосари 04.06.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-4 15-15-00"
    },
    {
      eventName: "Туробова Нилуфар Умедуллаевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директор ўринбосари 04.06.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-4 15-15-00"
    },
    {
      eventName: "Туробова Нилуфар Умедуллаевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директор ўринбосари 04.06.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-4 15-15-00"
    },
    {
      eventName: "Туробова Нилуфар Умедуллаевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директор ўринбосари 04.06.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-4 15-15-00"
    },
    {
      eventName: "Хамидова Фароғат Ахматовна Бойсун тумани 1-сонли умумтаълим мактаби директори 08.01.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-1-8 15-15-00"
    },
    {
      eventName: "Хамидова Фароғат Ахматовна Бойсун тумани 1-сонли умумтаълим мактаби директори 08.01.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-1-8 15-15-00"
    },
    {
      eventName: "Хамидова Фароғат Ахматовна Бойсун тумани 1-сонли умумтаълим мактаби директори 08.01.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-1-8 15-15-00"
    },
    {
      eventName: "Хамидова Фароғат Ахматовна Бойсун тумани 1-сонли умумтаълим мактаби директори 08.01.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-1-8 15-15-00"
    },
    {
      eventName: "Хамидова Фароғат Ахматовна Бойсун тумани 1-сонли умумтаълим мактаби директори 08.01.1980",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-1-8 15-15-00"
    },
    {
      eventName: "Рамазонова Хадича Тошбоевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директори   23.02.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-23 15-15-00"
    },
    {
      eventName: "Рамазонова Хадича Тошбоевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директори   23.02.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-23 15-15-00"
    },
    {
      eventName: "Рамазонова Хадича Тошбоевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директори   23.02.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-23 15-15-00"
    },
    {
      eventName: "Рамазонова Хадича Тошбоевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директори   23.02.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-23 15-15-00"
    },
    {
      eventName: "Рамазонова Хадича Тошбоевна Бойсун тумани 10-айрим фанлар чуқур ўрганиладиган ихтисослаштирилган мактаб-интернати директори   23.02.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-23 15-15-00"
    },
    {
      eventName: "Одинаева Дилором Тангриқуловна Бойсун тумани 4-сон мактабгача таълим муассасаси мудираси 03.08.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-3 15-15-00"
    },
    {
      eventName: "Одинаева Дилором Тангриқуловна Бойсун тумани 4-сон мактабгача таълим муассасаси мудираси 03.08.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-3 15-15-00"
    },
    {
      eventName: "Одинаева Дилором Тангриқуловна Бойсун тумани 4-сон мактабгача таълим муассасаси мудираси 03.08.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-3 15-15-00"
    },
    {
      eventName: "Одинаева Дилором Тангриқуловна Бойсун тумани 4-сон мактабгача таълим муассасаси мудираси 03.08.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-3 15-15-00"
    },
    {
      eventName: "Одинаева Дилором Тангриқуловна Бойсун тумани 4-сон мактабгача таълим муассасаси мудираси 03.08.1974",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-3 15-15-00"
    },
    {
      eventName: "Усмонова Моҳира Рахматовна Бойсун тумани 2-сон касб-ҳунар мактаби директори 04.04.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-4 15-15-00"
    },
    {
      eventName: "Усмонова Моҳира Рахматовна Бойсун тумани 2-сон касб-ҳунар мактаби директори 04.04.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-4 15-15-00"
    },
    {
      eventName: "Усмонова Моҳира Рахматовна Бойсун тумани 2-сон касб-ҳунар мактаби директори 04.04.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-4 15-15-00"
    },
    {
      eventName: "Усмонова Моҳира Рахматовна Бойсун тумани 2-сон касб-ҳунар мактаби директори 04.04.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-4 15-15-00"
    },
    {
      eventName: "Усмонова Моҳира Рахматовна Бойсун тумани 2-сон касб-ҳунар мактаби директори 04.04.1970",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-4 15-15-00"
    },
    {
      eventName: "Эрмаматова Сожида Жумақуловна Бойсун тумани 7-мактабгача таълим муассасаси мудираси 23.03.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-23 15-15-00"
    },
    {
      eventName: "Эрмаматова Сожида Жумақуловна Бойсун тумани 7-мактабгача таълим муассасаси мудираси 23.03.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-23 15-15-00"
    },
    {
      eventName: "Эрмаматова Сожида Жумақуловна Бойсун тумани 7-мактабгача таълим муассасаси мудираси 23.03.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-23 15-15-00"
    },
    {
      eventName: "Эрмаматова Сожида Жумақуловна Бойсун тумани 7-мактабгача таълим муассасаси мудираси 23.03.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-23 15-15-00"
    },
    {
      eventName: "Эрмаматова Сожида Жумақуловна Бойсун тумани 7-мактабгача таълим муассасаси мудираси 23.03.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-23 15-15-00"
    },
    {
      eventName: "Холмўминова Рўзигул Ибодуллаевна Бойсун тумани 1-сон касб-ҳунар мактаби директори 03.12.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-3 15-15-00"
    },
    {
      eventName: "Холмўминова Рўзигул Ибодуллаевна Бойсун тумани 1-сон касб-ҳунар мактаби директори 03.12.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-3 15-15-00"
    },
    {
      eventName: "Холмўминова Рўзигул Ибодуллаевна Бойсун тумани 1-сон касб-ҳунар мактаби директори 03.12.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-3 15-15-00"
    },
    {
      eventName: "Холмўминова Рўзигул Ибодуллаевна Бойсун тумани 1-сон касб-ҳунар мактаби директори 03.12.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-3 15-15-00"
    },
    {
      eventName: "Холмўминова Рўзигул Ибодуллаевна Бойсун тумани 1-сон касб-ҳунар мактаби директори 03.12.1967",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-3 15-15-00"
    },
    {
      eventName: "Насриддинова Интизор Собировна Бойсун тумани 6-Болалар мусиқа ва санъат мактаби директори 17.03.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-03-17 15-15-00"
    },
    {
      eventName: "Насриддинова Интизор Собировна Бойсун тумани 6-Болалар мусиқа ва санъат мактаби директори 17.03.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-03-17 15-15-00"
    },
    {
      eventName: "Насриддинова Интизор Собировна Бойсун тумани 6-Болалар мусиқа ва санъат мактаби директори 17.03.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-03-17 15-15-00"
    },
    {
      eventName: "Насриддинова Интизор Собировна Бойсун тумани 6-Болалар мусиқа ва санъат мактаби директори 17.03.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-03-17 15-15-00"
    },
    {
      eventName: "Насриддинова Интизор Собировна Бойсун тумани 6-Болалар мусиқа ва санъат мактаби директори 17.03.1990",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-03-17 15-15-00"
    },
    {
      eventName: "Очилов Сафарали Ҳусан ўғли Бойсун тумани 6-сон умумтаълим мактаби ўқитувчиси 05.07.1995",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-5 15-15-00"
    },
    {
      eventName: "Очилов Сафарали Ҳусан ўғли Бойсун тумани 6-сон умумтаълим мактаби ўқитувчиси 05.07.1995",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-5 15-15-00"
    },
    {
      eventName: "Очилов Сафарали Ҳусан ўғли Бойсун тумани 6-сон умумтаълим мактаби ўқитувчиси 05.07.1995",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-5 15-15-00"
    },
    {
      eventName: "Очилов Сафарали Ҳусан ўғли Бойсун тумани 6-сон умумтаълим мактаби ўқитувчиси 05.07.1995",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-5 15-15-00"
    },
    {
      eventName: "Очилов Сафарали Ҳусан ўғли Бойсун тумани 6-сон умумтаълим мактаби ўқитувчиси 05.07.1995",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-5 15-15-00"
    },
    {
      eventName: "Ҳикматова Интизор Нарзулло қизи Бойсун тумани 6-Болалар мусиқа ва санъат мактаби иш юритувчиси 14.02.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-14 15-15-00"
    },
    {
      eventName: "Ҳикматова Интизор Нарзулло қизи Бойсун тумани 6-Болалар мусиқа ва санъат мактаби иш юритувчиси 14.02.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-14 15-15-00"
    },
    {
      eventName: "Ҳикматова Интизор Нарзулло қизи Бойсун тумани 6-Болалар мусиқа ва санъат мактаби иш юритувчиси 14.02.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-14 15-15-00"
    },
    {
      eventName: "Ҳикматова Интизор Нарзулло қизи Бойсун тумани 6-Болалар мусиқа ва санъат мактаби иш юритувчиси 14.02.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-14 15-15-00"
    },
    {
      eventName: "Ҳикматова Интизор Нарзулло қизи Бойсун тумани 6-Болалар мусиқа ва санъат мактаби иш юритувчиси 14.02.1993",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-14 15-15-00"
    },
    {
      eventName: "Жабборова Сарвиноз Мавлоновна Бойсун тумани 1-сон умумтаълим мактаби ўқитувчиси 14.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-14-11 15-15-00"
    },
    {
      eventName: "Жабборова Сарвиноз Мавлоновна Бойсун тумани 1-сон умумтаълим мактаби ўқитувчиси 14.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-14-11 15-15-00"
    },
    {
      eventName: "Жабборова Сарвиноз Мавлоновна Бойсун тумани 1-сон умумтаълим мактаби ўқитувчиси 14.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-14-11 15-15-00"
    },
    {
      eventName: "Жабборова Сарвиноз Мавлоновна Бойсун тумани 1-сон умумтаълим мактаби ўқитувчиси 14.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-14-11 15-15-00"
    },
    {
      eventName: "Жабборова Сарвиноз Мавлоновна Бойсун тумани 1-сон умумтаълим мактаби ўқитувчиси 14.11.1981",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-14-11 15-15-00"
    },
    {
      eventName: "Рўзиев Холиқ Тошанович Бойсун тумани СЭО ва ЖС бўлими врачи 27.06.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-6-27 15-15-00"
    },
    {
      eventName: "Рўзиев Холиқ Тошанович Бойсун тумани СЭО ва ЖС бўлими врачи 27.06.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-6-27 15-15-00"
    },
    {
      eventName: "Рўзиев Холиқ Тошанович Бойсун тумани СЭО ва ЖС бўлими врачи 27.06.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-6-27 15-15-00"
    },
    {
      eventName: "Рўзиев Холиқ Тошанович Бойсун тумани СЭО ва ЖС бўлими врачи 27.06.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-6-27 15-15-00"
    },
    {
      eventName: "Рўзиев Холиқ Тошанович Бойсун тумани СЭО ва ЖС бўлими врачи 27.06.1959",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-6-27 15-15-00"
    },
    {
      eventName: "Рамазонова Хабиба Хафизовна Бойсун тумани Тиббиёт бирлашмаси туғруқ тизими Неанатологи 28.04.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-4-28 15-15-00"
    },
    {
      eventName: "Рамазонова Хабиба Хафизовна Бойсун тумани Тиббиёт бирлашмаси туғруқ тизими Неанатологи 28.04.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-4-28 15-15-00"
    },
    {
      eventName: "Рамазонова Хабиба Хафизовна Бойсун тумани Тиббиёт бирлашмаси туғруқ тизими Неанатологи 28.04.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-4-28 15-15-00"
    },
    {
      eventName: "Рамазонова Хабиба Хафизовна Бойсун тумани Тиббиёт бирлашмаси туғруқ тизими Неанатологи 28.04.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-4-28 15-15-00"
    },
    {
      eventName: "Рамазонова Хабиба Хафизовна Бойсун тумани Тиббиёт бирлашмаси туғруқ тизими Неанатологи 28.04.1957",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-4-28 15-15-00"
    },
    {
      eventName: "Болтаев Абдукарим Мажитович Бойсун тумани Тиббиёт бирлашмаси “Мачай” қишлоқ врачлик пункити мудири 10.12.1966 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-10 15-15-00"
    },
    {
      eventName: "Болтаев Абдукарим Мажитович Бойсун тумани Тиббиёт бирлашмаси “Мачай” қишлоқ врачлик пункити мудири 10.12.1966 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-10 15-15-00"
    },
    {
      eventName: "Болтаев Абдукарим Мажитович Бойсун тумани Тиббиёт бирлашмаси “Мачай” қишлоқ врачлик пункити мудири 10.12.1966 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-10 15-15-00"
    },
    {
      eventName: "Болтаев Абдукарим Мажитович Бойсун тумани Тиббиёт бирлашмаси “Мачай” қишлоқ врачлик пункити мудири 10.12.1966 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-10 15-15-00"
    },
    {
      eventName: "Болтаев Абдукарим Мажитович Бойсун тумани Тиббиёт бирлашмаси “Мачай” қишлоқ врачлик пункити мудири 10.12.1966 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-10 15-15-00"
    },
    {
      eventName: "Махмудов Эшпўлат Болтаевич Бойсун тумани Тиббиёт бирлашмаси кординатори 13.02.1973 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-13 15-15-00"
    },
    {
      eventName: "Махмудов Эшпўлат Болтаевич Бойсун тумани Тиббиёт бирлашмаси кординатори 13.02.1973 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-13 15-15-00"
    },
    {
      eventName: "Махмудов Эшпўлат Болтаевич Бойсун тумани Тиббиёт бирлашмаси кординатори 13.02.1973 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-13 15-15-00"
    },
    {
      eventName: "Махмудов Эшпўлат Болтаевич Бойсун тумани Тиббиёт бирлашмаси кординатори 13.02.1973 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-13 15-15-00"
    },
    {
      eventName: "Махмудов Эшпўлат Болтаевич Бойсун тумани Тиббиёт бирлашмаси кординатори 13.02.1973 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-13 15-15-00"
    },
    {
      eventName: "Шоймардонов Олимжон Рустамович Бойсун тумани тиббиёт бирлашмаси оналик ва болаликни мухофаза қилиш бўйича бош шифокор ўринбосари 19.10.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-19 15-15-00"
    },
    {
      eventName: "Шоймардонов Олимжон Рустамович Бойсун тумани тиббиёт бирлашмаси оналик ва болаликни мухофаза қилиш бўйича бош шифокор ўринбосари 19.10.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-19 15-15-00"
    },
    {
      eventName: "Шоймардонов Олимжон Рустамович Бойсун тумани тиббиёт бирлашмаси оналик ва болаликни мухофаза қилиш бўйича бош шифокор ўринбосари 19.10.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-19 15-15-00"
    },
    {
      eventName: "Шоймардонов Олимжон Рустамович Бойсун тумани тиббиёт бирлашмаси оналик ва болаликни мухофаза қилиш бўйича бош шифокор ўринбосари 19.10.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-19 15-15-00"
    },
    {
      eventName: "Шоймардонов Олимжон Рустамович Бойсун тумани тиббиёт бирлашмаси оналик ва болаликни мухофаза қилиш бўйича бош шифокор ўринбосари 19.10.1969",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-19 15-15-00"
    },
    {
      eventName: "Абдуғаниев Фарход Аллажонович Бойсун тумани Тиббиёт бирлашмаси шошилинч тиббий ёрдам бўлими реаниматологи 13.10.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-13 15-15-00"
    },
    {
      eventName: "Абдуғаниев Фарход Аллажонович Бойсун тумани Тиббиёт бирлашмаси шошилинч тиббий ёрдам бўлими реаниматологи 13.10.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-13 15-15-00"
    },
    {
      eventName: "Абдуғаниев Фарход Аллажонович Бойсун тумани Тиббиёт бирлашмаси шошилинч тиббий ёрдам бўлими реаниматологи 13.10.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-13 15-15-00"
    },
    {
      eventName: "Абдуғаниев Фарход Аллажонович Бойсун тумани Тиббиёт бирлашмаси шошилинч тиббий ёрдам бўлими реаниматологи 13.10.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-13 15-15-00"
    },
    {
      eventName: "Абдуғаниев Фарход Аллажонович Бойсун тумани Тиббиёт бирлашмаси шошилинч тиббий ёрдам бўлими реаниматологи 13.10.1977",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-13 15-15-00"
    },
    {
      eventName: "Умаров Даврон Зокирович Бойсун тумани Тиббиёт бирлашмаси куп тармокли марказий поликлиникаси шифокори, Неврапотолог 12.03.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-3-12 15-15-00"
    },
    {
      eventName: "Умаров Даврон Зокирович Бойсун тумани Тиббиёт бирлашмаси куп тармокли марказий поликлиникаси шифокори, Неврапотолог 12.03.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-3-12 15-15-00"
    },
    {
      eventName: "Умаров Даврон Зокирович Бойсун тумани Тиббиёт бирлашмаси куп тармокли марказий поликлиникаси шифокори, Неврапотолог 12.03.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-3-12 15-15-00"
    },
    {
      eventName: "Умаров Даврон Зокирович Бойсун тумани Тиббиёт бирлашмаси куп тармокли марказий поликлиникаси шифокори, Неврапотолог 12.03.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-3-12 15-15-00"
    },
    {
      eventName: "Умаров Даврон Зокирович Бойсун тумани Тиббиёт бирлашмаси куп тармокли марказий поликлиникаси шифокори, Неврапотолог 12.03.1966",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-3-12 15-15-00"
    },
    {
      eventName: "Бекназаров Умид Холмуротович Бойсун тумани “Бекназар бобо” хусусий фирмаси раҳбари 28.08.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-28 15-15-00"
    },
    {
      eventName: "Бекназаров Умид Холмуротович Бойсун тумани “Бекназар бобо” хусусий фирмаси раҳбари 28.08.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-28 15-15-00"
    },
    {
      eventName: "Бекназаров Умид Холмуротович Бойсун тумани “Бекназар бобо” хусусий фирмаси раҳбари 28.08.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-28 15-15-00"
    },
    {
      eventName: "Бекназаров Умид Холмуротович Бойсун тумани “Бекназар бобо” хусусий фирмаси раҳбари 28.08.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-28 15-15-00"
    },
    {
      eventName: "Бекназаров Умид Холмуротович Бойсун тумани “Бекназар бобо” хусусий фирмаси раҳбари 28.08.1978",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-28 15-15-00"
    },
    {
      eventName: "Нодиров Баходир Жўраевич Бойсун туманидаги Ўзбекистон Республикаси Бош вазирининг Тадбиркорлар мурожаатларини кўриб чиқиш қабулхонаси мудири 03.05.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-5-8 15-15-00"
    },
    {
      eventName: "Нодиров Баходир Жўраевич Бойсун туманидаги Ўзбекистон Республикаси Бош вазирининг Тадбиркорлар мурожаатларини кўриб чиқиш қабулхонаси мудири 03.05.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-5-8 15-15-00"
    },
    {
      eventName: "Нодиров Баходир Жўраевич Бойсун туманидаги Ўзбекистон Республикаси Бош вазирининг Тадбиркорлар мурожаатларини кўриб чиқиш қабулхонаси мудири 03.05.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-5-8 15-15-00"
    },
    {
      eventName: "Нодиров Баходир Жўраевич Бойсун туманидаги Ўзбекистон Республикаси Бош вазирининг Тадбиркорлар мурожаатларини кўриб чиқиш қабулхонаси мудири 03.05.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-5-8 15-15-00"
    },
    {
      eventName: "Нодиров Баходир Жўраевич Бойсун туманидаги Ўзбекистон Республикаси Бош вазирининг Тадбиркорлар мурожаатларини кўриб чиқиш қабулхонаси мудири 03.05.1971",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-5-8 15-15-00"
    },
    {
      eventName: "Каримов Ойбек Рахматуллаевич Ўзбекистон Республикаси Президентининг Бойсун туманидаги Халқ қабулхонаси мутахассиси 26.11.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-11-26 15-15-00"
    },
    {
      eventName: "Каримов Ойбек Рахматуллаевич Ўзбекистон Республикаси Президентининг Бойсун туманидаги Халқ қабулхонаси мутахассиси 26.11.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-11-26 15-15-00"
    },
    {
      eventName: "Каримов Ойбек Рахматуллаевич Ўзбекистон Республикаси Президентининг Бойсун туманидаги Халқ қабулхонаси мутахассиси 26.11.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-11-26 15-15-00"
    },
    {
      eventName: "Каримов Ойбек Рахматуллаевич Ўзбекистон Республикаси Президентининг Бойсун туманидаги Халқ қабулхонаси мутахассиси 26.11.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-11-26 15-15-00"
    },
    {
      eventName: "Каримов Ойбек Рахматуллаевич Ўзбекистон Республикаси Президентининг Бойсун туманидаги Халқ қабулхонаси мутахассиси 26.11.1991",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-11-26 15-15-00"
    },
    {
      eventName: "Норбоев Ғаффор Бойсун тумани Тожик Миллий маданият маркази раҳбари 14.02.1952 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-2-14 15-15-00"
    },
    {
      eventName: "Норбоев Ғаффор Бойсун тумани Тожик Миллий маданият маркази раҳбари 14.02.1952 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-2-14 15-15-00"
    },
    {
      eventName: "Норбоев Ғаффор Бойсун тумани Тожик Миллий маданият маркази раҳбари 14.02.1952 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-2-14 15-15-00"
    },
    {
      eventName: "Норбоев Ғаффор Бойсун тумани Тожик Миллий маданият маркази раҳбари 14.02.1952 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-2-14 15-15-00"
    },
    {
      eventName: "Норбоев Ғаффор Бойсун тумани Тожик Миллий маданият маркази раҳбари 14.02.1952 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-2-14 15-15-00"
    },
    {
      eventName: "Туробов Шайдулло Бекқулович Бойсун тумани 37-сон умумтаълим мактаби ўқитувчиси 10.07.1961 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-7-10 15-15-00"
    },
    {
      eventName: "Туробов Шайдулло Бекқулович Бойсун тумани 37-сон умумтаълим мактаби ўқитувчиси 10.07.1961 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-7-10 15-15-00"
    },
    {
      eventName: "Туробов Шайдулло Бекқулович Бойсун тумани 37-сон умумтаълим мактаби ўқитувчиси 10.07.1961 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-7-10 15-15-00"
    },
    {
      eventName: "Туробов Шайдулло Бекқулович Бойсун тумани 37-сон умумтаълим мактаби ўқитувчиси 10.07.1961 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-7-10 15-15-00"
    },
    {
      eventName: "Туробов Шайдулло Бекқулович Бойсун тумани 37-сон умумтаълим мактаби ўқитувчиси 10.07.1961 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-7-10 15-15-00"
    },
    {
      eventName: "Тўраев Анвар Тоштемирович Бойсун тумани “Тўда” маҳалла фуқаролар йиғини раиси 06.12.1980 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-12-6 15-15-00"
    },
    {
      eventName: "Тўраев Анвар Тоштемирович Бойсун тумани “Тўда” маҳалла фуқаролар йиғини раиси 06.12.1980 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-12-6 15-15-00"
    },
    {
      eventName: "Тўраев Анвар Тоштемирович Бойсун тумани “Тўда” маҳалла фуқаролар йиғини раиси 06.12.1980 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-12-6 15-15-00"
    },
    {
      eventName: "Тўраев Анвар Тоштемирович Бойсун тумани “Тўда” маҳалла фуқаролар йиғини раиси 06.12.1980 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-12-6 15-15-00"
    },
    {
      eventName: "Тўраев Анвар Тоштемирович Бойсун тумани “Тўда” маҳалла фуқаролар йиғини раиси 06.12.1980 ",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-12-6 15-15-00"
    },
    {
      eventName: "Хайдаров Комилжон Нусратиллоевич Бойсун тумани “Шах-юнан” хусусий фирмаси раҳбари 08.08.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-8-8 15-15-00"
    },
    {
      eventName: "Хайдаров Комилжон Нусратиллоевич Бойсун тумани “Шах-юнан” хусусий фирмаси раҳбари 08.08.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-8-8 15-15-00"
    },
    {
      eventName: "Хайдаров Комилжон Нусратиллоевич Бойсун тумани “Шах-юнан” хусусий фирмаси раҳбари 08.08.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-8-8 15-15-00"
    },
    {
      eventName: "Хайдаров Комилжон Нусратиллоевич Бойсун тумани “Шах-юнан” хусусий фирмаси раҳбари 08.08.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-8-8 15-15-00"
    },
    {
      eventName: "Хайдаров Комилжон Нусратиллоевич Бойсун тумани “Шах-юнан” хусусий фирмаси раҳбари 08.08.1982",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-8-8 15-15-00"
    },
    {
      eventName: "Қараев Холмурод Бойсун тумани “Бойсун” газетаси бош муҳаррири 19.10.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2021-10-19 15-15-00"
    },
    {
      eventName: "Қараев Холмурод Бойсун тумани “Бойсун” газетаси бош муҳаррири 19.10.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2022-10-19 15-15-00"
    },
    {
      eventName: "Қараев Холмурод Бойсун тумани “Бойсун” газетаси бош муҳаррири 19.10.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2023-10-19 15-15-00"
    },
    {
      eventName: "Қараев Холмурод Бойсун тумани “Бойсун” газетаси бош муҳаррири 19.10.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2024-10-19 15-15-00"
    },
    {
      eventName: "Қараев Холмурод Бойсун тумани “Бойсун” газетаси бош муҳаррири 19.10.1956",
      calendar: "Туғилган кун",
      color: "blue",
      eventTime: "2025-10-19 15-15-00"
    },
  ];
  function addDate(ev) {}

  var calendar = new Calendar("#calendar", data);
})();