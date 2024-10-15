window.onload = main;

const products = [
  {
    id: 1,
    name: 'meat',
    price: 30,
    image: 'images/products/meat.svg',
    type: 2,
  },
  {
    id: 2,
    name: 'apple',
    price: 10,
    image: 'images/products/apple.svg',
    type: 3,
  },
  {
    id: 3,
    name: 'banana',
    price: 15,
    image: 'images/products/banana.svg',
    type: 3,
  },
  {
    id: 4,
    name: 'cheese',
    price: 5,
    image: 'images/products/cheese.svg',
    type: 1,
  },
  {
    id: 5,
    name: 'chicken',
    price: 20,
    image: 'images/products/chicken.svg',
    type: 2,
  },
  {
    id: 6,
    name: 'crisps',
    price: 20,
    image: 'images/products/crisps.svg',
    type: 2,
  },
  {
    id: 7,
    name: 'grass',
    price: 1,
    image: 'images/products/grass.svg',
    type: 3,
  },
  {
    id: 8,
    name: 'jam',
    price: 5,
    image: 'images/products/jam.svg',
    type: 1,
  },
  {
    id: 9,
    name: 'milk',
    price: 10,
    image: 'images/products/milk.svg',
    type: 1,
  },
  {
    id: 10,
    name: 'pineapple',
    price: 10,
    image: 'images/products/pineapple.svg',
    type: 3,
  },
  {
    id: 10,
    name: 'vine',
    price: 50,
    image: 'images/products/vine.svg',
    type: 1,
  }
];

const cartPlace = document.querySelector('.cart__place');

const activeTimers = {};

function  main() {

  const lavka = new Lavka();
  lavka.getShelves().forEach((shelf) => {
    const type =  lavka.getShelfType(shelf);
    const items = products.filter((item) => item.type === type);
    let shelfWidth = shelf.getBoundingClientRect().width;
    let placeWidth = shelfWidth / items.length;
    const productPlaces = lavka.getProductPlacesOfShelf(shelf);

    items.forEach((item, index) => {
      const productModel = new Product(item);
      const productElement = productModel.getProductElement();
      productPlaces[index].append(productElement);
      productModel.setShelfPlace(productPlaces[index]);
      productElement.style.width = `${placeWidth}px`;

      window.addEventListener('resize', (e) => {
        shelfWidth = shelf.getBoundingClientRect().width;
        placeWidth = shelfWidth / items.length;
        productElement.style.width = `${placeWidth}px`;
      });

      function handleDownEvent({pageX, pageY}) {
        const startY = pageY;

        if (activeTimers[productModel.id]) {
          activeTimers[productModel.id].stop();
          delete activeTimers[productModel.id];
        }

        const cartRect = cartPlace.getBoundingClientRect();

        let coords = getCoords(productElement);
        let shiftX = pageX - coords.left;

        let shiftY = pageY - coords.top;
        const shelfPlace = productModel.getShelfPlace();
        document.body.appendChild(productElement);

        productElement.style.position = 'absolute';
        productElement.classList.remove('transition');
        productElement.style.bottom = 'unset';
        moveAt({pageX, pageY});

        productElement.style.zIndex = '50'; // над другими элементами

        function moveAt({pageX, pageY}) {
          productElement.style.left = pageX - shiftX + 'px';
          productElement.style.top = pageY - shiftY + 'px';
        }

        function handleMoveEvent({pageX, pageY}) {
          moveAt({pageX, pageY});
        }

        document.onmousemove = (e) => {handleMoveEvent({pageX: e.pageX, pageY: e.pageY})};
        document.ontouchmove = (e) => {
          handleMoveEvent({
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY,
          })
        };

        const buyingButton = new Button();

        function handleUpEvent({pageX, pageY}) {
          document.onmousemove = null;
          document.ontouchmove = null;
          document.onmouseup = null;
          document.ontouchend = null;

          productElement.style.zIndex = 'unset';

          productElement.classList.add('transition');

          if ((pageX - shiftX) > cartRect.x && pageX + shiftX < (cartRect.x + cartRect.width) || pageY - startY > 50) {
            productElement.style.top = `${cartRect.y + cartRect.height - productElement.getBoundingClientRect().height}px`;
            productElement.style.left = `${pageX - shiftX}px`;

            activeTimers[productModel.id] = new Timer({
              onEnd() {
                productModel.setShelfPlace(undefined);
                productElement.classList.remove('transition');
                cartPlace.append(productElement);
                productElement.style.top = 'unset';
                productElement.style.bottom = '0';
                productElement.style.left = `${(pageX - cartRect.x - shiftX) / cartRect.width * 100}%`;

                buyingButton.update(!isEmptyCart());
              },
              duration: 500,
            });
          } else {
            const shelfRect = shelfPlace.getBoundingClientRect();
            productElement.style.top = `${shelfRect.y + shelfRect.height - productElement.getBoundingClientRect().height}px`;
            productElement.style.left = `${shelfRect.x}px`;

            activeTimers[productModel.id] = new Timer({
              onEnd() {
                productElement.classList.remove('transition');

                productElement.style.position = 'relative';
                productElement.style.left = 'unset';
                productElement.style.top = 'unset';
                productElement.style.bottom = 'unset';

                shelfPlace.append(productElement);
              },
              duration: 500,
            });
          }
        }

        document.onmouseup = (e) => {handleUpEvent({pageX: e.pageX, pageY: e.pageY})};
        document.ontouchend = (e) => {
          handleUpEvent({
            pageX: e.changedTouches.item(0).pageX,
            pageY: e.changedTouches.item(0).pageY,
          });
        };
      }

      productElement.onmousedown = (e) => {
        handleDownEvent({
          pageX: e.pageX,
          pageY: e.pageY
        })};
      productElement.ontouchstart = (e) => {
        e.preventDefault();

        handleDownEvent({
          pageX: e.touches[0].pageX,
          pageY: e.touches[0].pageY,
        });
      };

      productElement.ondragstart = function() {
        return false;
      };
    })
  });
}

function getCoords(elem) {   // кроме IE8-
  let box = elem.getBoundingClientRect();
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset,
  };
}

function isEmptyCart() {
  const items = document.querySelector('.cart__place').childNodes;
  return items.length < 3;
}

function updateBuyButton (isShow) {
  const buyButton = document.querySelector('.buying');
  buyButton.style.display = isShow ? 'block' : 'none';
}

class Timer {
  constructor(params) {
    this.params = params;

    this.passedTime = 0;

    this.tick = this.tick.bind(this);
    this.interval = setInterval(this.tick, 16);
  }

  tick() {
    this.passedTime += 16;

    if (this.passedTime >= this.params.duration) {
      clearInterval(this.interval);

      if (this.params.onEnd) {
        this.params.onEnd();
      }
    }

  }

  stop() {
    clearInterval(this.interval);
  }
}

class Product {
  constructor(props) {
    this.add(props);
  }

  getProductElement() {
    return this.element;
  }

  setShelfPlace(place) {
    this.place = place;
  }

  getShelfPlace() {
    return this.place;
  }

  add(item) {
    this.id = item.id;
    this.element = document.createElement('img');
    this.element.src = item.image;
    this.element.className = 'product';
  }
}

class Lavka {
  getShelfType(shelf) {
    return + shelf.className.split("_").at(-1);
  }

  getShelves() {
    return document.querySelectorAll('.shelves__shelf');
  }

  getProductPlacesOfShelf(shelf) {
    return shelf.querySelectorAll('.shelves__place');
  }
}

class Button {
  getElement() {
    return document.querySelector('.buying');
  }

  update(isShow) {
    const buyButton = this.getElement();
    buyButton.style.display = isShow ? 'block' : 'none';
    isShow ? buyButton.classList.add('blink') : buyButton.classList.remove('blink');
  }
}