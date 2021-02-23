import { render, screen } from '@testing-library/react';
import CollapsibleTree from './CollapsibleTree';

test('renders learn react link', () => {
  render(<CollapsibleTree />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
