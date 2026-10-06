import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format, startOfMonth, subMonths } from 'date-fns';
import CheckInHistory from '@/components/somatic/CheckInHistory';
import { supabase } from '@/api/supabaseClient';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-user' } }),
}));

vi.mock('@/api/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/components/somatic/PatternInsights', () => ({
  default: ({ checkins }) => <div data-testid="insight-count">{checkins.length}</div>,
}));

function mockCheckins(data) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue({ data });
  supabase.from.mockReturnValue(query);
}

describe('CheckInHistory', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('filters all summaries by a selected month and expands session notes', async () => {
    const currentDate = new Date();
    const historicDate = subMonths(currentDate, 4);
    const currentDateValue = format(currentDate, 'yyyy-MM-dd');
    const historicDateValue = format(historicDate, 'yyyy-MM-dd');

    mockCheckins([
      {
        id: 'current',
        date: currentDateValue,
        survival_state: 'safe',
        pre_score: 5,
        post_score: 7,
        exercises_completed: ['one'],
        reflection: '',
      },
      {
        id: 'historic',
        date: historicDateValue,
        survival_state: 'fight',
        pre_score: 3,
        post_score: 6,
        exercises_completed: ['one', 'two'],
        reflection: 'I noticed more space in my chest.',
      },
    ]);

    render(<CheckInHistory onNewSession={vi.fn()} />);

    await waitFor(() => expect(screen.getAllByText(/Safe/).length).toBeGreaterThan(0));
    expect(screen.queryAllByText(/Fight/)).toHaveLength(0);
    expect(screen.getByTestId('insight-count')).toHaveTextContent('1');
    expect(screen.getByText('SESSIONS').parentElement).toHaveTextContent('1');

    fireEvent.change(screen.getByLabelText('Choose month'), {
      target: { value: format(startOfMonth(historicDate), 'yyyy-MM-dd') },
    });

    const historicDateLabel = format(historicDate, 'MMM d, yyyy');
    await waitFor(() => expect(screen.getByText(historicDateLabel)).toBeInTheDocument());
    expect(screen.queryAllByText(/Safe/)).toHaveLength(0);
    expect(screen.getByTestId('insight-count')).toHaveTextContent('1');
    expect(screen.getByText('SESSIONS').parentElement).toHaveTextContent('1');

    fireEvent.click(screen.getByText(historicDateLabel).closest('button'));
    expect(await screen.findByText('I noticed more space in my chest.')).toBeInTheDocument();
  });
});
