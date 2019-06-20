
/////// Model ////////

const budgetController = (function() {

   const Expense = function(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
      this.percentage = -1;
   };

   // This one calculates percentage of each item
   Expense.prototype.calcPercentage = function(totalInc) {
      if (totalInc > 0) {
         this.percentage = Math.round((this.value / totalInc) * 100);
      } else {
         this.percentage = -1;
      }
   };

   // This one returns each percentage
   Expense.prototype.getPercentage = function() {
      return this.percentage;
   };

   const Income = function(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
   };

   const calculateTotal = function(type) {
      let sum = 0;
      data.allItems[type].forEach((item) => sum = sum + item.value);
      data.totals[type] = sum;
   };
   
   
   let data = {
      allItems: {
         exp: [],
         inc: []
      },
      totals: {
         exp: 0,
         inc: 0
      },
      budget: 0,
      percentage: -1
   };

   return {
      addItem: function(type, des, val) {
         let newItem, id;

         if (data.allItems[type].length > 0) {
            id = data.allItems[type][data.allItems[type].length - 1].id + 1;
         } else {
            id = 0;
         }
         
         // Create new item based on inc or exp type
         if (type === 'exp') {
            newItem = new Expense(id, des, val);
         } else if (type === 'inc') {
            newItem = new Income(id, des, val);
         }

         // Push it to our data structure and return the new element
         data.allItems[type].push(newItem);
         return newItem;
      },

      deleteItem: function(type, id) {
         // loop over the elements to find the id that matches, so we can remove the item
         const ids = data.allItems[type].map((item) => {
            return item.id;
         });

         // Store the id that the controller passes, when it matches the id of the new array (map method)
         let index = ids.indexOf(id);
         if (index !== -1) {
            data.allItems[type].splice(index, 1);
         }
      },

      calculateBudget: function() {
         // Calculate total income and expenses
         calculateTotal('exp');
         calculateTotal('inc');

         // Calculate budget: income - expenses
         data.budget = data.totals.inc - data.totals.exp;

         // Calculate percentage of income spent
         if (data.totals.inc > 0) {
            data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
         } else {
            data.percentage = -1;
         }
      },

      calculatePercentages: function() {
         data.allItems.exp.forEach((item) => {
            item.calcPercentage(data.totals.inc);
         });
      },

      getPercentages: function() {
         const allPercentages = data.allItems.exp.map((item) => {
            return item.getPercentage();
         })
         return allPercentages;
      },

      getBudget: function() {
         return {
            budget: data.budget,
            totalInc: data.totals.inc,
            totalExp: data.totals.exp,
            percentage: data.percentage
         }
      },

      testing: function() {
         console.log(data);
      }
   };
   
})();





/////// View ////////

const UIController = (function() {

   const DOMStrings = {
      inputType: '.add__type',
      inputDescription: '.add__description',
      inputValue: '.add__value',
      inputButton: '.add__btn',
      incomeContainer: '.income__list',
      expensesContainer: '.expenses__list',
      budgetLabel: '.budget__value',
      incomeLabel: '.budget__income--value',
      expensesLabel: '.budget__expenses--value',
      percentageLabel: '.budget__expenses--percentage',
      container: '.container',
      expensesPercentageLabel: '.item__percentage',
      dateLabel: '.budget__title--month'
   };

   const formatNumber = function(num, type) {
      // + or - before a number, exactly 2 decimal points, and comma separating the thousands

      num = Math.abs(num);
      num = num.toFixed(2);
      const numSplit = num.split('.');

      // Get the int for the comma
      let int = numSplit[0];
      if (int.length > 3) {
         // Put comma on the number if it is a thousand at least
         int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
      }
      // Get the decimal part
      const decimal = numSplit[1];

      // Merge it all
      return (type === 'exp' ? sign = '-' : sign = '+') + ' ' + int + '.' + decimal;
   };

   const nodeListForEach = function(list, callback) {
      for (let i = 0; i < list.length; i++) {
         callback(list[i], i);
      }
   }

   return {
      getInput: function() {
         return {
            type: document.querySelector(DOMStrings.inputType).value, // Either inc or exp
            description: document.querySelector(DOMStrings.inputDescription).value,
            value: parseInt(document.querySelector(DOMStrings.inputValue).value)
         }
      },

      addListItem: function(obj, type) {
         let html, element;

         // Create HTML string with placeholder text

         if (type === 'inc') {
            element = DOMStrings.incomeContainer;
            html =
            `<div class="item clearfix" id="inc-${obj.id}">
               <div class="item__description">${obj.description}</div>
               <div class="right clearfix">
                  <div class="item__value">${formatNumber(obj.value, type)}</div>
                  <div class="item__delete">
                     <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                  </div>
               </div>
            </div>`;
         } else {
            element = DOMStrings.expensesContainer;
            html =
            `<div class="item clearfix" id="exp-${obj.id}">
               <div class="item__description">${obj.description}</div>
               <div class="right clearfix">
                  <div class="item__value">${formatNumber(obj.value, type)}</div>
                  <div class="item__percentage">21%</div>
                  <div class="item__delete">
                     <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                  </div>
               </div>
            </div>`
         }

         // Insert Adjacent HTML into DOM
         document.querySelector(element).insertAdjacentHTML('beforeend', html);
      },

      deleteListItem: function(selectorId) {
         const element = document.getElementById(selectorId);
         element.parentNode.removeChild(element);
      },

      clearFields: function() {
         const fields = document.querySelectorAll(`${DOMStrings.inputDescription}, ${DOMStrings.inputValue}`);
         const fieldsArray = Array.from(fields);
         fieldsArray.forEach((item) => item.value = '');
         fieldsArray[0].focus();
      },

      displayBudget: function(obj) {

         let type;
         obj.budget > 0 ? type = 'inc' : type = 'exp';

         document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
         document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
         document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

         if (obj.percentage > 0) {
            document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
         } else {
            document.querySelector(DOMStrings.percentageLabel).textContent = '---';
         }
      },

      displayPercentages: function(percentageArray) {
         const fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);

         nodeListForEach(fields, (current, index) => {
            if (percentageArray[index] > 0) {
               current.textContent = percentageArray[index] + '%';
            } else {
               current.textContent = '---';
            }
         });
      },

      displayMonth: function() {
         const now = new Date();
         const year = now.getFullYear();
         const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
         const month = now.getMonth();
         document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ', ' + year;
      },

      changeType: function() {
         let fields = document.querySelectorAll(DOMStrings.inputType + ',' + DOMStrings.inputDescription + ',' + DOMStrings.inputValue);

         nodeListForEach(fields, function(current) {
            current.classList.toggle('red-focus');
         });

         document.querySelector(DOMStrings.inputButton).classList.toggle('red');
      },

      resetType: function() {
         const inpType = document.querySelector(DOMStrings.inputType).value = 'inc';
      },

      getDOMStrings: function() {
         return DOMStrings;
      }
   }
})();



/////// CONTROLLER ////////

const controller = (function(budgetCtrl, UICtrl) {

   const setupEventListeners = function() {
      const DOM = UICtrl.getDOMStrings();
      document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);

      document.addEventListener('keypress', (e) => {
         if (e.keycode === 13 || e.which === 13) {
            ctrlAddItem();
         }
      });

      document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

      document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
   };

   const updateBudget = function() {
      // 1. Calculate the budget
      budgetCtrl.calculateBudget();

      // 2. Return budget
      const budget = budgetCtrl.getBudget();

      // 3. Update the budget on UI
      UICtrl.displayBudget(budget);
   };

   const updatePercentages = function() {
      // 1. Calculate percentages
      budgetCtrl.calculatePercentages();

      // 2. Read percentages from budget controller
      const percentages = budgetCtrl.getPercentages();

      // 3. Update UI
      UICtrl.displayPercentages(percentages);
   };

   const ctrlAddItem = function() {
      let input, newItem;

      // 1. Get the field input data
      input = UICtrl.getInput();
      
      if (input.description != '' && !isNaN(input.value) && input.value > 0) {
         // 2. Add item to Budget controller
         newItem = budgetCtrl.addItem(input.type, input.description, input.value);

         // 3. Add item to UI and clear fields
         UICtrl.addListItem(newItem, input.type);
         UICtrl.clearFields();

         // 5. Calculate and update budget with updateBudget()
         updateBudget();

         // 6. Calculate and update percentages
         updatePercentages();
      }
   };

   const ctrlDeleteItem = function(e) {
      const itemId = e.target.parentNode.parentNode.parentNode.parentNode.id;

      if ( itemId) {
         // Get values of the item to be removed
         let splitId = itemId.split('-');
         let type = splitId[0];
         let Id = parseInt(splitId[1]);

         // 1. Delete item from data, using the parameters that deleteItem (budgetCtrl) expects
         budgetCtrl.deleteItem(type, Id);

         // 2. Delete item from UI
         UICtrl.deleteListItem(itemId);

         // 3. Update budget
         updateBudget();

         // 4. Calculate and update percentages
         updatePercentages();
      }
   };


   // The big IIFE returns the init function, so we can call it outside
   return {
      init: function() {
         console.log('App has started');
         UICtrl.resetType();
         UICtrl.displayMonth();
         UICtrl.displayBudget({
            budget: 0,
            totalInc: 0,
            totalExp: 0,
            percentage: -1
         });
         setupEventListeners();
      }
   };
})(budgetController, UIController);

// Calling init
controller.init();