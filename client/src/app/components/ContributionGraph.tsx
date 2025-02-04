import { useState, useEffect } from 'react';
import styles from './ContributionGraph.module.css';

interface ContributionData {
  date: string;
  count: number;
}

interface ContributionGraphProps {
  data?: ContributionData[];
}

const ContributionGraph = ({ data = [] }: ContributionGraphProps) => {
  const [squares, setSquares] = useState<ContributionData[]>(() => {
    const today = new Date();
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(today.getMonth() - 9);
    
    // 計算天數差
    const daysDiff = Math.floor((today.getTime() - nineMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    
    if (data.length === 0) {
      return [...Array(daysDiff)].map((_, i) => {
        const date = new Date(nineMonthsAgo);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5)
        };
      });
    }
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= nineMonthsAgo && itemDate <= today;
    });
  });

  useEffect(() => {
    if (data.length > 0) {
      const today = new Date();
      const nineMonthsAgo = new Date();
      nineMonthsAgo.setMonth(today.getMonth() - 9);
      
      const filteredData = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= nineMonthsAgo && itemDate <= today;
      });
      
      setSquares(filteredData);
    }
  }, [data]);

  const getContributionColor = (count: number) => {
    if (count === 0) return 'var(--contribution-empty)';
    if (count <= 1) return 'var(--contribution-l1)';
    if (count <= 3) return 'var(--contribution-l2)';
    if (count <= 6) return 'var(--contribution-l3)';
    return 'var(--contribution-l4)';
  };

  // 獲取過去9個月的月份標籤
  const getLastNineMonths = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const result = [];
    
    for (let i = 8; i >= 0; i--) {
      const monthIndex = (today.getMonth() - i + 12) % 12;
      result.push(months[monthIndex]);
    }
    
    return result;
  };

  const months = getLastNineMonths();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graph}>
        <ul className={styles.months}>
          {months.map(month => (
            <li key={month}>{month}</li>
          ))}
        </ul>
        <ul className={styles.days}>
          {days.map(day => (
            <li key={day}>{day}</li>
          ))}
        </ul>
        <ul className={styles.squares}>
          {squares.map((square, i) => (
            <li
              key={i}
              style={{ backgroundColor: getContributionColor(square.count) }}
              title={`${square.date}: ${square.count} contributions`}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ContributionGraph;