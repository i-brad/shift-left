import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRow, IsoBox, IsoScene, Label, Pipe, Server } from './pieces';
import { fitViewBox, project } from './projection';

const wrap = (ui: React.ReactNode) =>
  render(
    <IsoScene bounds={[[0, 0, 0], [10, 10, 5]]} label="test scene">
      {ui}
    </IsoScene>,
  );

describe('projection', () => {
  it('maps the origin to the origin', () => {
    expect(project([0, 0, 0])).toEqual([0, 0]);
  });

  it('raises points as z grows', () => {
    expect(project([0, 0, 1])[1]).toBeLessThan(project([0, 0, 0])[1]);
  });

  it('fits a viewBox around points with padding', () => {
    expect(fitViewBox([[0, 0, 0]], [10, 10, 10, 10])).toBe('-10 -10 20 20');
  });
});

describe('IsoBox', () => {
  it('draws three faces', () => {
    wrap(<IsoBox x={0} y={0} w={1} d={1} h={1} tone="sky" testId="box" />);
    expect(screen.getByTestId('box').querySelectorAll('polygon')).toHaveLength(3);
  });
});

describe('Label', () => {
  it('renders its text with the tone', () => {
    const { container } = wrap(<Label at={[0, 0, 0]} text="₦500,000 ✕" tone="bad" />);
    expect(screen.getByText('₦500,000 ✕')).toBeInTheDocument();
    expect(container.querySelector('[data-tone="bad"]')).not.toBeNull();
  });
});

describe('Server', () => {
  it('shows its title and rule chip', () => {
    wrap(<Server x={0} y={0} title="Validator" rule="amount < 500,000" ruleTone="bad" tone="rose" />);
    expect(screen.getByTestId('server-validator')).toHaveAttribute('data-tone', 'rose');
    expect(screen.getByText('amount < 500,000')).toBeInTheDocument();
  });
});

describe('Pipe', () => {
  it('uses static dots when motion is reduced', () => {
    const { container } = render(
      <IsoScene bounds={[[0, 0, 0], [5, 5, 0]]} label="x" reducedMotion>
        <Pipe from={[0, 0, 0]} to={[5, 0, 0]} dots={2} />
      </IsoScene>,
    );
    expect(container.querySelectorAll('animateMotion')).toHaveLength(0);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});

describe('BlockRow', () => {
  it('is an accessible image with every caption', () => {
    render(<BlockRow label="three partitions" items={[{ title: 'A', tone: 'pink' }, { title: 'B', tone: 'sky' }]} />);
    expect(screen.getByRole('img', { name: 'three partitions' })).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
