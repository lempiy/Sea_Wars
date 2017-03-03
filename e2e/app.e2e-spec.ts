import { SeaWarsPage } from './app.po';

describe('sea-wars App', function() {
  let page: SeaWarsPage;

  beforeEach(() => {
    page = new SeaWarsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    //expect(page.getParagraphText()).toEqual('app works!');
  });
});
