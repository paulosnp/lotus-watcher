import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDetails } from './card-details';

describe('CardDetails', () => {
  let component: CardDetails;
  let fixture: ComponentFixture<CardDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
