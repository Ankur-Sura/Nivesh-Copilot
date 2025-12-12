import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "top",
      labels: {
        font: {
          size: 11
        },
        padding: 8
      }
    },
    title: {
      display: true,
      text: "Holdings",
      font: {
        size: 14,
        weight: 'normal'
      },
      padding: {
        top: 5,
        bottom: 10
      }
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          size: 10
        },
        maxTicksLimit: 6
      }
    },
    x: {
      ticks: {
        font: {
          size: 10
        },
        maxRotation: 45,
        minRotation: 45
      }
    }
  },
  layout: {
    padding: {
      left: 5,
      right: 5,
      top: 5,
      bottom: 5
    }
  }
};

export function VerticalGraph({ data }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      minHeight: '200px',
      maxHeight: '100%'
    }}>
      <Bar options={options} data={data} />
    </div>
  );
}
