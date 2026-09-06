import React from "react";

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
        return null;
    }

    const data = payload[0];

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
            <p className="font-medium text-gray-800">
                {data.payload.status}
            </p>

            <p className="text-sm text-gray-600 mt-1">
                Count:{" "}
                <span className="font-semibold text-gray-900">
                    {data.value}
                </span>
            </p>
        </div>
    );
};

export default CustomTooltip;