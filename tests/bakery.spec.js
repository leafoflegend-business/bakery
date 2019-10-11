const Bakery = require('../src/bakery.js');

const delay = length => new Promise(res => {
  setTimeout(() => res(), length);
});

describe('Bakery', () => {
  it('can be constructed', () => {
    expect(new Bakery()).toBeTruthy();
  });

  it('can be given a name', () => {
    const bakery = new Bakery('fullstack');

    expect(bakery.name).toEqual('fullstack');
  });

  it('defaults to "Eliots Bakery" if not given a name', () => {
    expect(new Bakery().name).toEqual('Eliots Bakery');
  });

  describe('Baking and Eating', () => {
    let bakery;

    beforeEach(() => {
      bakery = new Bakery();
    });

    it('can bake a cake', () => {
      expect(bakery.bake('cake')).toEqual(
        expect.objectContaining({
          type: 'cake',
        })
      );
    });

    it('can bake a good that can be consumed', () => {
      const cake = bakery.bake('cake');

      expect(cake.consume()).toEqual(true);
    });

    it('cannot consume a baked good that has already been consumed', () => {
      const cake = bakery.bake('cake');

      cake.consume();

      expect(cake.consume()).toEqual(false);
    });
  });

  describe('Pricing', () => {
    let bakery;
    let cake;

    beforeEach(() => {
      bakery = new Bakery();

      cake = bakery.bake('cake');
    });

    it('can set a price on a type of baked good', () => {
      bakery.price('cake', 20);

      expect(cake.price).toEqual(20);
    });

    it('throws an error if not given a number', () => {
      expect(() => bakery.price('cake', '20')).toThrow();
    });

    it('can set a price with a decimal on a type of baked good', () => {
      bakery.price('cake', 20.14);

      expect(cake.price).toEqual(20.14);
    });

    it('can set a price with a decimal and round off digits for a type of baked good', () => {
      bakery.price('cake', 20.146);

      expect(cake.price).toEqual(20.15);
    });

    it('can retrieve updated prices for the same item', () => {
      bakery.price('cake', 20.14);

      expect(cake.price).toEqual(20.14);

      bakery.price('cake', 1);

      expect(cake.price).toEqual(1);
    });

    it('can retrieve the price of a good without having the good', () => {
      bakery.price('cake', 5.42);

      expect(bakery.askPrice('cake')).toEqual(5.42);
    });

    it('can set a price on an as yet unbaked good', () => {
      bakery.price('donut', 1);

      expect(bakery.askPrice('donut')).toEqual(1);
    });

    it('can get price of a good from the good, even if the price is set before its baked', () => {
      bakery.price('donut', 1);

      const donut = bakery.bake('donut');

      expect(donut.price).toEqual(1);
    });

    it('defaults all baked goods to 0 dollars', () => {
      const croissant = bakery.bake('croissant');

      expect(croissant.price).toEqual(0);
    });
  });

  describe('Inventory Management', () => {
    let bakery;
    let numOfCakes;
    let cakePrice;
    let numOfDonuts;
    let donutPrice;

    beforeEach(() => {
      bakery = new Bakery();

      numOfCakes = Math.ceil(Math.random() * 99) + 1;
      numOfDonuts = Math.ceil(Math.random() * 99) + 1;

      cakePrice = Math.ceil(Math.random() * 19) + 1;
      donutPrice = Math.ceil(Math.random() * 19) + 1;

      bakery.price('cake', cakePrice);
      bakery.price('donut', donutPrice);

      for (let cakes = 0; cakes < numOfCakes; ++cakes) {
        bakery.bake('cake');
      }

      for (let donuts = 0; donuts < numOfDonuts; ++donuts) {
        bakery.bake('donut');
      }
    });

    it('can get the quantity of a given baked good remaining', () => {
      expect(bakery.quantityRemaining('cake')).toEqual(numOfCakes);
      expect(bakery.quantityRemaining('donut')).toEqual(numOfDonuts);
    });

    it('returns 0 for a baked good weve never had', () => {
      expect(bakery.quantityRemaining('cronut')).toEqual(0);
    });

    it('returns the total quantity of the bakery if given no argument', () => {
      expect(bakery.quantityRemaining()).toEqual(numOfCakes + numOfDonuts);
    });

    it('adjusts the quantity if i eat my product', () => {
      const cake = bakery.bake('cake');

      expect(bakery.quantityRemaining('cake')).toEqual(numOfCakes + 1);

      cake.consume();

      expect(bakery.quantityRemaining('cake')).toEqual(numOfCakes);
    });

    it('i can retrieve items by oldest baked first', async () => {
      bakery = new Bakery();

      const firstCake = bakery.bake('cake');

      await delay(100);

      bakery.bake('cake');

      const retrievedCake = bakery.retrieve('cake');

      expect(retrievedCake).toEqual(firstCake);
    });

    it('i can ask for the baked on date for any item', () => {
      const now = Date.now();

      const cake = bakery.bake('cake');

      expect(cake.bakedOn().getTime() >= now).toEqual(true);
    });

    it('if nothing is found, returns null', () => {
      const cronut = bakery.retrieve('cronut');

      expect(cronut).toEqual(null);
    });

    it('retrieved items can be consumed', () => {
      const startingQuantity = bakery.quantityRemaining('cake');

      const cake = bakery.retrieve('cake');
      cake.consume();

      expect(bakery.quantityRemaining('cake')).toEqual(startingQuantity - 1);
    });

    it('retrieving and consuming goes in order from oldest to newest', () => {
      let lastCake = null;
      let nextCake = bakery.retrieve('cake');

      while (nextCake) {
        expect(nextCake.consume()).toEqual(true);
        lastCake = nextCake;
        nextCake = bakery.retrieve('cake');

        if (lastCake && nextCake) {
          expect(nextCake.bakedOn().getTime() >= lastCake.bakedOn().getTime());
        }
      }
    });

    it('can report on the value of inventory remaining for a baked good', () => {
      expect(bakery.inventoryValue('cake')).toEqual(cakePrice * bakery.quantityRemaining('cake'));
    });

    it('can report on the value of the total inventory remaining', () => {
      expect(bakery.inventoryValue()).toEqual((cakePrice * bakery.quantityRemaining('cake')) + (donutPrice * bakery.quantityRemaining('donut')));
    });

    it('reports 0 for goods we have not baked', () => {
      expect(bakery.inventoryValue('cronut')).toEqual(0);
    });
  });

  describe('Sales', () => {
    let bakery;
    let numOfCakes;
    let cakePrice;
    let numOfDonuts;
    let donutPrice;

    beforeEach(() => {
      bakery = new Bakery();

      numOfCakes = Math.ceil(Math.random() * 95) + 5;
      numOfDonuts = Math.ceil(Math.random() * 95) + 5;

      cakePrice = Math.ceil(Math.random() * 19) + 5;
      donutPrice = Math.ceil(Math.random() * 19) + 5;

      bakery.price('cake', cakePrice);
      bakery.price('donut', donutPrice);

      for (let cakes = 0; cakes < numOfCakes; ++cakes) {
        bakery.bake('cake');
      }

      for (let donuts = 0; donuts < numOfDonuts; ++donuts) {
        bakery.bake('donut');
      }
    });

    it('can sell a baked good', () => {
      const cake = bakery.purchase('cake');

      expect(cake).toEqual(expect.objectContaining({
        type: 'cake',
      }))
    });

    it('can sell many baked goods', () => {
      const cakes = bakery.purchase('cake', 5);

      expect(cakes.length).toEqual(5);
      cakes.forEach(cake => {
        expect(cake).toEqual(expect.objectContaining({
          type: 'cake',
        }));
      });
    });

    it('selling cakes removes them from the inventory', () => {
      const startingQuantity = bakery.quantityRemaining('cake');

      const cakes = bakery.purchase('cake', 5);

      expect(bakery.quantityRemaining('cake')).toEqual(startingQuantity - cakes.length);
    });

    it('sold cakes can be consumed', () => {
      const cakes = bakery.purchase('cake', 5);

      cakes.forEach(cake => {
        expect(cake.consume()).toEqual(true);
      });
    });

    it('sold cakes can only be consumed once', () => {
      const cakes = bakery.purchase('cake', 5);

      cakes.forEach(cake => {
        expect(cake.consume()).toEqual(true);
      });

      cakes.forEach(cake => {
        expect(cake.consume()).toEqual(false);
      });
    });

    it('a customer cannot eat a cake if i eat it first 😏', () => {
      // These should be the same cake if we are retrieving/purchasing them by bake time.
      const theCake = bakery.retrieve('cake');
      const customerCake = bakery.purchase('cake');

      expect(theCake.consume()).toEqual(true);
      expect(customerCake.consume()).toEqual(false);
    });

    it('i cannot purchase something that was never baked', () => {
      expect(() => bakery.purchase('cronut')).toThrow();
    });

    it('i cannot purchase more items than are in stock', () => {
      expect(() => bakery.purchase('cake', numOfCakes + 1)).toThrow();
    });

    it('i cannot purchase something by explaining quantity with anything but a number', () => {
      expect(() => bakery.purchase('cake', 'sleven')).toThrow();
    });

    it('after purchasing some things, i can check the register for how much ive made 💵', () => {
      bakery.purchase('cake');
      bakery.purchase('donut');

      expect(bakery.inspectCashRegister()).toEqual(cakePrice + donutPrice);
    });
  });
});
