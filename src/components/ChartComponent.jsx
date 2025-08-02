import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Chart.js v3+ automatically handles registration

/**
 * A wrapper component to use Chart.js within a React application.
 * It handles the creation, destruction, and updating of the chart instance.
 */
const ChartComponent = ({ type, data, options }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        // Destroy the previous chart instance before creating a new one
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: type,
            data: data,
            options: options,
        });

        // Cleanup function to destroy the chart when the component unmounts
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]); // Re-render the chart if these props change

    return <canvas ref={canvasRef}></canvas>;
};

export default ChartComponent;