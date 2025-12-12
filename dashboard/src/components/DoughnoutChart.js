import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        padding: 6,
        font: {
          size: 9,
          weight: '400'
        },
        color: '#ffffff',
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8
      }
    },
    tooltip: {
      enabled: true,
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      titleFont: {
        size: 11,
        weight: 'bold'
      },
      bodyFont: {
        size: 10
      }
    }
  },
  cutout: '55%',
  layout: {
    padding: 0
  }
};

export function DoughnutChart({ data }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      maxWidth: '280px',
      maxHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Doughnut data={data} options={doughnutOptions} />
    </div>
  );
}
